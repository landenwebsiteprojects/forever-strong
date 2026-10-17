# Violations and Practices of TrickyStore Author

## 📦 Use of Open-Source Code Without Proper Licensing

- Took headers from AOSP for stubbing without providing proper attribution or respecting licensing norms [¹](#references).
- Statically linked an LGPLv3 library into their binary but failed to release their source or comply with LGPL requirements [²](#references).

## 🚫 "All Rights Reserved"

- Initially published code with **no license**, making it "all rights reserved" despite using open-source components [³](#references).
- Invited pull requests (“PRs welcome”) while keeping the code legally closed – **taking from the community without giving back** [⁴](#references).

## 🔒 Shift to Fully Closed-Source

- After releasing a few open-source versions, decided to fully close-source the project with:
  - Encrypted module binaries
  - Obfuscated APKs
- Claimed:  
  > “Due to rampant misuse and fewer contributions than expected, this module will be closed-source starting from version 1.1.0.” [⁵](#references)

---

## References

1. https://github.com/5ec1cff/TrickyStore/tree/master/module/src/main/cpp/binder/include/binder
2. https://github.com/5ec1cff/TrickyStore/blob/master/module/src/main/cpp/CMakeLists.txt#L28  
3. https://github.com/5ec1cff/TrickyStore/pull/84  
4. https://github.com/5ec1cff/TrickyStore/blob/master/README.md?plain=1#L91  
5. https://github.com/5ec1cff/TrickyStore/blob/release/README.md?plain=1#L11 
