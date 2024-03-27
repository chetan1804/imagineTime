cmake_minimum_required(VERSION 3.15)

set(DOKAN_DIR "${CMAKE_CURRENT_SOURCE_DIR}/dokan")

# === Flutter Library ===
set(DOKAN_LIBRARY "${DOKAN_DIR}/dokan1.dll")

# Published to parent scope for install step.
set(DOKAN_LIBRARY ${DOKAN_LIBRARY} PARENT_SCOPE)
# set(PROJECT_BUILD_DIR "${PROJECT_DIR}/build/" PARENT_SCOPE)
#set(AOT_LIBRARY "${PROJECT_DIR}/build/windows/app.so" PARENT_SCOPE)

list(APPEND DOKAN_LIBRARY_HEADERS
  "dokan/dokan.h"
  "dokan/fileinfo.h"
  "dokan/public.h"
)
list(TRANSFORM DOKAN_LIBRARY_HEADERS PREPEND "${DOKAN_DIR}/dokan")
add_library(dokan INTERFACE)
target_include_directories(dokan INTERFACE "${DOKAN_DIR}")
target_link_libraries(dokan INTERFACE "${DOKAN_DIR}/lib/dokan1.lib")
add_dependencies(dokan dokan_assemble)

# install dll
set(BUILD_BUNDLE_DIR "$<TARGET_FILE_DIR:${BINARY_NAME}>")
install(FILES "${DOKAN_LIBRARY}" DESTINATION "${BUILD_BUNDLE_DIR}"
  COMPONENT Runtime)  