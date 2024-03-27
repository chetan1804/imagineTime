cmake_minimum_required(VERSION 3.15)

set(DOKAN_HL_DIR "${CMAKE_CURRENT_SOURCE_DIR}/dokan_hl")
set(PROJECT_NAME "flutter_dokan")
project(${PROJECT_NAME} LANGUAGES CXX)

# flutter dokan includes
set(DOKAN_INCLUDES 
  "${DOKAN_HL_DIR}/dokan_mirror.cpp"
  "${DOKAN_HL_DIR}/dokan_mirror.h")

# This value is used when generating builds using this plugin, so it must
# not be changed
set(PLUGIN_NAME "flutter_dokan_plugin")

add_library(${PLUGIN_NAME} SHARED
  "flutter_dokan_plugin.cpp"
  ${DOKAN_INCLUDES}
)
apply_standard_settings(${PLUGIN_NAME})
set_target_properties(${PLUGIN_NAME} PROPERTIES
  CXX_VISIBILITY_PRESET hidden)
target_compile_definitions(${PLUGIN_NAME} PRIVATE FLUTTER_PLUGIN_IMPL)
target_include_directories(${PLUGIN_NAME} INTERFACE
  "${CMAKE_CURRENT_SOURCE_DIR}/include"
  "${CMAKE_CURRENT_SOURCE_DIR}/dokan_hl"
)
target_link_libraries(${PLUGIN_NAME} PRIVATE flutter flutter_wrapper_plugin dokan)

# List of absolute paths to libraries that should be bundled with the plugin
set(flutter_dokan_bundled_libraries
  ""
  PARENT_SCOPE
)

# fix for error on MSVC
if (MSVC)
  # warning level 4 and all warnings as errors
  target_compile_options(${PLUGIN_NAME} PRIVATE /W3 /WX- )
  # for spdlog
  target_compile_definitions(${PLUGIN_NAME} PRIVATE SPDLOG_WCHAR_TO_UTF8_SUPPORT)
endif()

# add dokan and spdlog
include(${CMAKE_CURRENT_SOURCE_DIR}/dokan/CMakeLists.txt)

