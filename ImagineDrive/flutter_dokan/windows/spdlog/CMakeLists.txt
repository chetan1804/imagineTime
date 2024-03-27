cmake_minimum_required(VERSION 3.15)

set(SPDLOG_DIR "${CMAKE_CURRENT_SOURCE_DIR}/spdlog")

# Published to parent scope for install step.
# set(PROJECT_BUILD_DIR "${PROJECT_DIR}/build/" PARENT_SCOPE)
#set(AOT_LIBRARY "${PROJECT_DIR}/build/windows/app.so" PARENT_SCOPE)

# list(TRANSFORM SPDLOG_LIBRARY_HEADERS PREPEND "${SPDLOG_DIR}/dokan")
add_library(spdlog INTERFACE)
target_include_directories(spdlog INTERFACE "${SPDLOG_DIR}")
target_link_libraries(spdlog INTERFACE "${SPDLOG_DIR}/lib/spdlogd.lib")
add_dependencies(spdlog spdlog_assemble)