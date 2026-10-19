# Local implementation of `__cxa_atexit` and `__cxa_finalize` (for zygisk modules)

In the [Itanium C++ ABI](https://itanium-cxx-abi.github.io/cxx-abi/abi.html#dso-dtor-runtime-api), global variable destructors are registered using `__cxa_atexit` and called by `__cxa_finalize` during dlclose. 
However, these functions are provided by libc, and registered destructors are stored in the global AtexitEntry array. 
Even after the destructors are called, gaps are left in the array. 
Therefore, C++ Zygisk modules could be detected using the AtexitEntry array. 

This repository provides a local implementation of `__cxa_atexit` and `__cxa_finalize` that ensures your Zygisk module does not interfere with the global AtexitEntry array while correctly implementing global object destruction.

This implementation is inspired by bionic (https://android.googlesource.com/platform/bionic/+/master/libc/bionic/atexit.cpp), with necesscary modifications.

## Usage

Add `atexit.cpp` to your zygisk module's source code set.
