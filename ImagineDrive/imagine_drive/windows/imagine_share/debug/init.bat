::type .\AutoRegisterOverlay.txt
:: Turn off echo
@echo off
:: Clear the screen
cls
:: Current 32-bit system
SET fwpath="%windir%\Microsoft.NET\Framework\v4.0.30319"
SET regPara="/reg:32"
SET installDir="%ProgramFiles(x86)%\Imagine Share"
:: Current system 64
if exist %windir%\SysWOW64 (SET fwpath="%windir%\Microsoft.NET\Framework64\v4.0.30319")
if exist %windir%\SysWOW64 (SET regPara="/reg:64")
@echo %fwpath%
@echo %regPara%
@echo %installDir%
%fwpath%\regasm.exe %installDir%\ImagineShare.dll /register /codebase
::Rename Registry
reg copy "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\ShellIconOverlayIdentifiers\ImagineShareSynced" "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\ShellIconOverlayIdentifiers\    ImagineShareSynced" /s /f  %regPara%
reg copy "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\ShellIconOverlayIdentifiers\ImagineShareSyncing" "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\ShellIconOverlayIdentifiers\    ImagineShareSyncing" /s /f  %regPara%
reg delete "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\ShellIconOverlayIdentifiers\ImagineShareSynced" /f  %regPara%
reg delete "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\ShellIconOverlayIdentifiers\ImagineShareSyncing" /f  %regPara%

:: Restart Windows File Resource Manager after completion
::taskkill   /im   explorer.exe   /f
::start   %windir%\explorer.exe