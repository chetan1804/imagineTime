//
//  Generated file. Do not edit.
//

#include "generated_plugin_registrant.h"

#include <flutter_dokan/flutter_dokan_plugin.h>
#include <url_launcher_windows/url_launcher_plugin.h>

void RegisterPlugins(flutter::PluginRegistry* registry) {
  FlutterDokanPluginRegisterWithRegistrar(
      registry->GetRegistrarForPlugin("FlutterDokanPlugin"));
  UrlLauncherPluginRegisterWithRegistrar(
      registry->GetRegistrarForPlugin("UrlLauncherPlugin"));
}
