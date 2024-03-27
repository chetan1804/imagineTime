#include "include/flutter_dokan/flutter_dokan_plugin.h"
#include "dokan_hl/dokan_mirror.h"

// This must be included before many other Windows headers.
#include <windows.h>

// For getPlatformVersion; remove unless needed for your plugin implementation.
#include <VersionHelpers.h>

#include <flutter/method_channel.h>
#include <flutter/plugin_registrar_windows.h>
#include <flutter/standard_method_codec.h>

#include <map>
#include <memory>
#include <sstream>
#include <thread>
#include <mutex>

#define LISTENER 0					// 1 if enable listener

namespace {

	class FlutterDokanPlugin;
	
	/*
		Class for custom listener when file was updated or any changes
	*/
	class MyFileListener : public mirroring::FileListener {
		FlutterDokanPlugin*			_plugin;

	public:
		MyFileListener(FlutterDokanPlugin* plugin)
		{
			_plugin = plugin;
		}
		void OnFileUpdated(unsigned int fileState, std::wstring& filename, std::wstring& oldname);
	};

	class FlutterDokanPlugin : public flutter::Plugin {
	public:
		static void RegisterWithRegistrar(flutter::PluginRegistrarWindows* registrar);

		FlutterDokanPlugin(std::shared_ptr<flutter::MethodChannel<flutter::EncodableValue>> pChannel);

		// mount the virtual drive
		const char* Mount(std::wstring& driveName, std::wstring& targetDir, std::wstring& driveDescrip);

		// unmount the virtual drive
		void Unmount(wchar_t driveLetter);

		virtual ~FlutterDokanPlugin();

	private:
		friend MyFileListener;
		std::shared_ptr<flutter::MethodChannel<flutter::EncodableValue>>
														_methodChannel = 0;
		std::thread										dirListenThread;
		std::atomic<bool>								_mounted = false;
		std::mutex										_mutex;

		// for searching files
		HANDLE hDir;
		std::wstring _lastTargetDir = L"";

		void CheckDirUpdates(std::wstring& targetDir);

		// Called when a method is called on this plugin's channel from Dart.
		void HandleMethodCall(
			const flutter::MethodCall<flutter::EncodableValue>& method_call,
			std::unique_ptr<flutter::MethodResult<flutter::EncodableValue>> result);

		// called when a file was changed
		void OnFileChanged(int32_t fileState, std::wstring& filename, std::wstring& oldname);
	};

	// static
	void FlutterDokanPlugin::RegisterWithRegistrar(
		flutter::PluginRegistrarWindows* registrar) {
		auto channel =
			std::make_shared<flutter::MethodChannel<flutter::EncodableValue>>(
				registrar->messenger(), "flutter_dokan",
				&flutter::StandardMethodCodec::GetInstance());

		auto plugin = std::make_unique<FlutterDokanPlugin>(channel);

		channel->SetMethodCallHandler(
			[plugin_pointer = plugin.get()](const auto& call, auto result) {
			plugin_pointer->HandleMethodCall(call, std::move(result));
		});

		registrar->AddPlugin(std::move(plugin));
	}

	FlutterDokanPlugin::FlutterDokanPlugin(std::shared_ptr<flutter::MethodChannel<flutter::EncodableValue>> pChannel) {
		_methodChannel = pChannel;
#if _DEBUG
		//int step = 0;
		//while (!IsDebuggerPresent())
		//{
		//	std::this_thread::sleep_for(std::chrono::seconds(1));
		//}
#endif 
	}

	FlutterDokanPlugin::~FlutterDokanPlugin() {
		//Unmount();
	}


	void FlutterDokanPlugin::CheckDirUpdates(std::wstring &targetDir)
	{	
		if (_lastTargetDir.compare(L"") == 0 || _lastTargetDir != targetDir)
		{
			_lastTargetDir = targetDir;
			hDir = CreateFile(
				_lastTargetDir.c_str(),							// pointer to the DIR
				FILE_LIST_DIRECTORY,                // access (read/write) mode
				FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,  // share mode
				NULL,                               // security descriptor
				OPEN_EXISTING,                      // how to create
				FILE_FLAG_BACKUP_SEMANTICS,         // file attributes
				NULL                                // file with attributes to copy
			);
		}
		FILE_NOTIFY_INFORMATION Buffer[1024];
		wchar_t filename[MAX_PATH];
		DWORD BytesReturned;

		while (ReadDirectoryChangesW(
			hDir,                                  // handle to directory
			&Buffer,                                    // read results buffer
			sizeof(Buffer),                                // length of buffer
			TRUE,                                 // monitoring option
			FILE_NOTIFY_CHANGE_CREATION |
			FILE_NOTIFY_CHANGE_LAST_ACCESS |
			FILE_NOTIFY_CHANGE_LAST_WRITE |
			FILE_NOTIFY_CHANGE_SIZE |
			FILE_NOTIFY_CHANGE_DIR_NAME |
			FILE_NOTIFY_CHANGE_FILE_NAME,            // filter conditions
			&BytesReturned,              // bytes returned
			NULL,                          // overlapped buffer
			NULL
		) )
		{
			std::lock_guard<std::mutex> guard(_mutex);
			if (!_mounted)
				break;

			int offset = 0;
			FILE_NOTIFY_INFORMATION* pNotify;
			pNotify = (FILE_NOTIFY_INFORMATION*)((char*)Buffer + offset);
			wcscpy_s(filename, L"");

			wcsncpy_s(filename, pNotify->FileName, pNotify->FileNameLength / 2);

			filename[pNotify->FileNameLength / 2] = NULL;
			std::wstring _tmpStr(filename);
			OnFileChanged(Buffer[0].Action, _tmpStr, std::wstring(L""));
		}

		//return NULL;
	}
	std::condition_variable f;
	void FlutterDokanPlugin::HandleMethodCall(
		const flutter::MethodCall<flutter::EncodableValue>& method_call,
		std::unique_ptr<flutter::MethodResult<flutter::EncodableValue>> result) {

		//std::unique_lock<std::mutex> lock(_methodChannel->_mutex);
		//f.wait(lock, []() { return ready.load(); });
		
		auto methodName = method_call.method_name();
		if (methodName.compare("getPlatformVersion") == 0) {
			std::ostringstream version_stream;
			version_stream << "Windows ";
			if (IsWindows10OrGreater()) {
				version_stream << "10+";
			}
			else if (IsWindows8OrGreater()) {
				version_stream << "8";
			}
			else if (IsWindows7OrGreater()) {
				version_stream << "7";
			}
			result->Success(flutter::EncodableValue(version_stream.str()));
		}
		else if (methodName.compare("mount") == 0){
			auto argumentVariant = ((flutter::EncodableList*)method_call.arguments())[0];
			auto driveName = std::get<std::string>(argumentVariant[0]);
			auto targetDir = std::get<std::string>(argumentVariant[1]);
			auto driveDescrip = std::get<std::string>(argumentVariant[2]);
			auto driveNameW = std::wstring(driveName.begin(), driveName.end());
			auto targetDirW = std::wstring(targetDir.begin(), targetDir.end());
			auto driveDescripW = std::wstring(driveDescrip.begin(), driveDescrip.end());
			auto error = Mount(driveNameW, targetDirW, driveDescripW);
			if (strlen(error) > 0)
				result->Error(std::string(error));
			else
				result->Success(flutter::EncodableValue("success"));
		}
		else if (methodName.compare("unmount") == 0) {
			auto driveLetter = std::get<std::string>(method_call.arguments()[0]);
			Unmount((wchar_t)driveLetter[0]);
			result->Success(flutter::EncodableValue("success"));
		}
		else if (methodName.compare("setFileAttribute") == 0) {
			auto list = ((flutter::EncodableList*)method_call.arguments())[0];
			auto filename = std::get<std::string>(list[0]);
			auto attrib = std::get<int>(list[1]);
			auto filenamew = std::wstring(filename.begin(), filename.end());
			SetFileAttributes(filenamew.c_str(), attrib);
			result->Success();
		}
		else {
			result->NotImplemented();
		}
	}

	void FlutterDokanPlugin::OnFileChanged(int32_t fileState, std::wstring& filename, std::wstring& oldname)
	{
		std::unique_lock<std::mutex> lock(_mutex);

		// notify flutter
		auto arguments = std::make_unique<flutter::EncodableValue>(flutter::EncodableList{
					flutter::EncodableValue((int32_t)fileState),
					flutter::EncodableValue(std::string(filename.begin(), filename.end())),
					flutter::EncodableValue(std::string(oldname.begin(), oldname.end()))
			});
		_methodChannel->InvokeMethod("onFileChanged", std::move(arguments));
	}

	const char* FlutterDokanPlugin::Mount(
		std::wstring& driveName,
		std::wstring& targetDir,
		std::wstring& driveDescrip) {

		if (_mounted)
			return "";

		_mounted = true;

		try {
			// start thread for drive mount
			auto plugin = this;
			auto dokanThread = std::thread([driveName, targetDir, driveDescrip, plugin]{
#if LISTENER == 1
				auto listener = new MyFileListener(plugin);
#else 
				MyFileListener* listener = NULL;
#endif
				mirroring::MountSimple(driveName.c_str(), targetDir.c_str(), driveDescrip.c_str(), listener);
			});
			dokanThread.detach();
			return "";
		}
		catch (const char *error)
		{
			return error;
		}
	}

	void FlutterDokanPlugin::Unmount(wchar_t driveLetter) {
		if (!_mounted)
			return;
		_mounted = false;
		auto unmountThread = std::thread([driveLetter] {
			mirroring::Unmount(driveLetter);
		});
		unmountThread.detach();
	}

	void MyFileListener::OnFileUpdated(unsigned int fileState, std::wstring& filename, std::wstring& oldname)
	{
		_plugin->OnFileChanged(fileState, filename, oldname);
	}

}  // namespace

void FlutterDokanPluginRegisterWithRegistrar(
	FlutterDesktopPluginRegistrarRef registrar) {
	FlutterDokanPlugin::RegisterWithRegistrar(
		flutter::PluginRegistrarManager::GetInstance()
		->GetRegistrar<flutter::PluginRegistrarWindows>(registrar));
}
