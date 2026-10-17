/* Halloween Edition validation utility. SPDX-License-Identifier: GPL-3.0-or-later */
import java.io.*;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.*;
import java.security.cert.*;
import java.security.interfaces.*;
import java.security.spec.*;
import java.util.*;
import javax.xml.parsers.*;
import org.w3c.dom.*;
import org.xml.sax.*;

/** Strict offline XML, PEM and key/certificate pairing check. No key content in output. */
public final class KeyboxValidator {
    static Element child(Element e, String name) throws Exception {
        NodeList nodes=e.getElementsByTagName(name);
        if(nodes.getLength()!=1) throw new Exception("Missing or duplicate "+name);
        return (Element)nodes.item(0);
    }
    static byte[] pem(String text) throws Exception {
        String value=text.replaceAll("-----[A-Z0-9 ]+-----", "").replaceAll("\\s", "");
        return Base64.getDecoder().decode(value);
    }
    static byte[] tlv(byte[] der, int[] pos, int tag) throws Exception {
        int p=pos[0];
        if(p+2>der.length || (der[p++]&255)!=tag) throw new Exception("Invalid key encoding");
        int len=der[p++]&255;
        if((len&128)!=0) {int count=len&127;len=0;if(count>4||count==0)throw new Exception("Invalid DER length");while(count-->0)len=(len<<8)|(der[p++]&255);}
        if(len<0 || p+len>der.length) throw new Exception("Truncated key");
        pos[0]=p+len;return Arrays.copyOfRange(der,p,p+len);
    }
    static PrivateKey key(String text, PublicKey pub) throws Exception {
        byte[] der=pem(text);String alg=pub.getAlgorithm();
        KeyFactory factory=KeyFactory.getInstance(alg);
        if(text.contains("BEGIN EC PRIVATE KEY")) {
            byte[] seq=tlv(der,new int[]{0},48);int[] pos={0};tlv(seq,pos,2);byte[] scalar=tlv(seq,pos,4);
            if(!(pub instanceof ECPublicKey))throw new Exception("Key algorithm mismatch");
            return factory.generatePrivate(new ECPrivateKeySpec(new BigInteger(1,scalar),((ECPublicKey)pub).getParams()));
        }
        if(text.contains("BEGIN RSA PRIVATE KEY")) {
            byte[] seq=tlv(der,new int[]{0},48);int[] pos={0};tlv(seq,pos,2);BigInteger[] parts=new BigInteger[8];
            for(int i=0;i<parts.length;i++)parts[i]=new BigInteger(tlv(seq,pos,2));
            return factory.generatePrivate(new RSAPrivateCrtKeySpec(parts[0],parts[1],parts[2],parts[3],parts[4],parts[5],parts[6],parts[7]));
        }
        return factory.generatePrivate(new PKCS8EncodedKeySpec(der));
    }
    public static void validate(Path path) throws Exception {
        byte[] bytes=Files.readAllBytes(path);
        if(bytes.length==0||bytes.length>1048576)throw new Exception("Keybox size invalid");
        String text=new String(bytes,StandardCharsets.UTF_8);
        if(text.toUpperCase(Locale.ROOT).contains("<!DOCTYPE")||text.toUpperCase(Locale.ROOT).contains("<!ENTITY"))throw new Exception("XML entities are forbidden");
        DocumentBuilderFactory f=DocumentBuilderFactory.newInstance();
        f.setExpandEntityReferences(false);f.setNamespaceAware(false);
        DocumentBuilder b=f.newDocumentBuilder();
        b.setEntityResolver((publicId,systemId)->{throw new SAXException("External entities forbidden");});
        b.setErrorHandler(new org.xml.sax.helpers.DefaultHandler(){public void error(SAXParseException e)throws SAXException{throw e;}public void fatalError(SAXParseException e)throws SAXException{throw e;}});
        Document d=b.parse(new ByteArrayInputStream(bytes));
        Element root=d.getDocumentElement();
        if(!root.getTagName().equals("AndroidAttestation"))throw new Exception("Invalid keybox root");
        NodeList boxes=root.getElementsByTagName("Keybox");
        if(boxes.getLength()<1||Integer.parseInt(child(root,"NumberOfKeyboxes").getTextContent().trim())!=boxes.getLength())throw new Exception("Keybox count mismatch");
        for(int i=0;i<boxes.getLength();i++) {
            NodeList keys=((Element)boxes.item(i)).getElementsByTagName("Key");
            if(keys.getLength()<1)throw new Exception("No attestation keys");
            Set<String> algs=new HashSet<>();
            for(int j=0;j<keys.getLength();j++) {
                Element k=(Element)keys.item(j);String alg=k.getAttribute("algorithm");
                if(!alg.equals("ecdsa")&&!alg.equals("rsa"))throw new Exception("Unsupported key algorithm");
                if(!algs.add(alg))throw new Exception("Duplicate key algorithm");
                Element chain=child(k,"CertificateChain");NodeList certs=chain.getElementsByTagName("Certificate");
                if(certs.getLength()<1||Integer.parseInt(child(chain,"NumberOfCertificates").getTextContent().trim())!=certs.getLength())throw new Exception("Certificate count mismatch");
                java.security.cert.CertificateFactory cf=java.security.cert.CertificateFactory.getInstance("X.509");
                X509Certificate[] c=new X509Certificate[certs.getLength()];
                for(int n=0;n<c.length;n++)c[n]=(X509Certificate)cf.generateCertificate(new ByteArrayInputStream(pem(certs.item(n).getTextContent())));
                PublicKey pub=c[0].getPublicKey();
                if((alg.equals("rsa")&&!pub.getAlgorithm().equals("RSA"))||(alg.equals("ecdsa")&&!pub.getAlgorithm().equals("EC")))throw new Exception("Key algorithm mismatch");
                PrivateKey priv=key(child(k,"PrivateKey").getTextContent(),pub);
                Signature sig=Signature.getInstance(alg.equals("rsa")?"SHA256withRSA":"SHA256withECDSA");
                byte[] challenge="Halloween keybox validation".getBytes(StandardCharsets.UTF_8);
                sig.initSign(priv);sig.update(challenge);byte[] signed=sig.sign();sig.initVerify(pub);sig.update(challenge);
                if(!sig.verify(signed))throw new Exception("Private key does not match certificate");
                for(int n=0;n<c.length-1;n++)c[n].verify(c[n+1].getPublicKey());
            }
        }
    }
    public static void main(String[] args) {
        try {if(args.length!=1)throw new Exception("One input path required");validate(Paths.get(args[0]));System.out.println("Keybox XML, key pairing and certificate chain validated. Trust and revocation were not checked.");}
        catch(Exception e){System.err.println("Keybox validation failed: malformed XML, key material, certificate chain or count.");System.exit(1);}
    }
}
