cmake_minimum_required(VERSION 3.15)

set(IMAGINE_SHARE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/imagine_share")
set(IMAGINE_DLL_DEBUG "${IMAGINE_SHARE_DIR}/debug/ImagineShare.dll" 
 "${IMAGINE_SHARE_DIR}/debug/ImagineShare.pdb"
 "${IMAGINE_SHARE_DIR}/debug/ImagineShare.dll.config"
 "${IMAGINE_SHARE_DIR}/debug/SharpShell.dll"
 "${IMAGINE_SHARE_DIR}/debug/Newtonsoft.Json.dll"
 "${IMAGINE_SHARE_DIR}/debug/dokan1.dll"
 "${IMAGINE_SHARE_DIR}/debug/dokan1.pdb"
 "${IMAGINE_SHARE_DIR}/debug/dokan1.sys"
 "${IMAGINE_SHARE_DIR}/debug/dokanctl.exe"
 "${IMAGINE_SHARE_DIR}/debug/sqlite3.dll"
 "${IMAGINE_SHARE_DIR}/debug/init.bat"
 "${IMAGINE_SHARE_DIR}/debug/uninit.bat"
 "${IMAGINE_SHARE_DIR}/debug/ucrtbased.dll"
 "${IMAGINE_SHARE_DIR}/debug/msvcp140d.dll"
 "${IMAGINE_SHARE_DIR}/debug/vcruntime140_1d.dll"
 "${IMAGINE_SHARE_DIR}/debug/vcruntime140d.dll"
 )
 
set(IMAGINE_DLL_RELEASE "${IMAGINE_SHARE_DIR}/release/ImagineShare.dll"
 "${IMAGINE_SHARE_DIR}/release/ImagineShare.dll.config"
 "${IMAGINE_SHARE_DIR}/release/SharpShell.dll"
 "${IMAGINE_SHARE_DIR}/release/Newtonsoft.Json.dll"
 "${IMAGINE_SHARE_DIR}/release/dokan1.dll"
 "${IMAGINE_SHARE_DIR}/release/dokan1.sys"
 "${IMAGINE_SHARE_DIR}/release/dokanctl.exe"
 "${IMAGINE_SHARE_DIR}/release/sqlite3.dll"
 "${IMAGINE_SHARE_DIR}/release/init.bat"
 "${IMAGINE_SHARE_DIR}/release/uninit.bat"
 "${IMAGINE_SHARE_DIR}/release/ucrtbase.dll"
 "${IMAGINE_SHARE_DIR}/release/msvcp140.dll"
 "${IMAGINE_SHARE_DIR}/release/vcruntime140_1.dll"
 "${IMAGINE_SHARE_DIR}/release/vcruntime140.dll"
 )

install(FILES "${IMAGINE_DLL_RELEASE}" DESTINATION "${CMAKE_INSTALL_PREFIX}"
  CONFIGURATIONS Profile;Release
  COMPONENT Runtime)
install(FILES "${IMAGINE_DLL_DEBUG}" DESTINATION "${CMAKE_INSTALL_PREFIX}"
  CONFIGURATIONS Debug
  COMPONENT Runtime)