# ImagineTime SecureSend

A virtual printer for uploading and emailing files using ImagineTime.

## System Requirements

* 64-bit Windows 7 or later
* .NET Framework 4.6.1 or later

## Building

Visual Studio 2019 and Wix 3.11+ are required to build

Links to, and distributes the following third party components:

* Microsoft Postscript Printer Driver (V3)
* Redmon 1.9 (64-bit)




## Notes

Build an install.

1) Build ImagineTimeDesktop package
```
cd ImagineTimeDesktop
npm install
npm run package-win
```

This creates the release-builds directory.

2) Delete existing install packages
```
cd ImagineTimeInstall
del bin
del obj
```

3) Open ImagineTime Solution in Visual Studio and build the install package


"C:\Program Files (x86)\WiX Toolset v3.11\bin\heat.exe" dir .\release-builds\ImagineTime-win32-ia32 -out dir.wxs -scom -frag -srd -sreg -gg -cg MyId -dr BIN_DIR_REF

