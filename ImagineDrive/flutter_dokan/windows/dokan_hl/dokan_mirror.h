#ifndef _DOKAN_MIRROR_H_
#define _DOKAN_MIRROR_H_

#include <dokan/dokan.h>
#include <xstring>

namespace mirroring {
	class FileListener {
	public:
		virtual void OnFileUpdated(unsigned int fileState, std::wstring& filename, std::wstring& oldname) = 0;
		void OnFileUpdated(unsigned int fileState, std::wstring& filename) {
			OnFileUpdated(fileState, filename, std::wstring(L""));
		}
	};

	extern void Unmount(const wchar_t driveLetter);

	extern void Mount(DOKAN_OPTIONS dokanOptions, FileListener* pListener);

	// use to mount the dokan drive
	// @param driveName: can be any unused letters eg: x:
	// @param targetDir: the directorty to be mirrored
	// @param driveDescript: the description to be displayed
	// @param listener: derived data to handle callbacks
	extern void MountSimple(
		const wchar_t* driveName,
		const wchar_t* targetDir,
		const wchar_t* driveDescrip,
		FileListener* pListener);
}

#endif // !_DOKAN_MIRROR_H_
