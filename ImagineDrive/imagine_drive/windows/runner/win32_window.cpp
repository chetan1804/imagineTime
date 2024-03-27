#include "win32_window.h"

#include <flutter_windows.h>

#include "resource.h"
#include <Shlwapi.h>

#define SWM_TRAYMSG WM_APP //		the message ID sent to our window

#define SWM_SHOW WM_APP + 1 //	show the window
#define SWM_HIDE WM_APP + 2 //	hide the window
#define SWM_EXIT WM_APP + 3 //	close the window

namespace
{
  constexpr const wchar_t kWindowClassName[] = L"FLUTTER_RUNNER_WIN32_WINDOW";

  // The number of Win32Window objects that currently exist.
  static int g_active_window_count = 0;

  using EnableNonClientDpiScaling = BOOL __stdcall(HWND hwnd);

  // Scale helper to convert logical scaler values to physical using passed in
  // scale factor
  int Scale(int source, double scale_factor)
  {
    return static_cast<int>(source * scale_factor);
  }

  // Dynamically loads the |EnableNonClientDpiScaling| from the User32 module.
  // This API is only needed for PerMonitor V1 awareness mode.
  void EnableFullDpiSupportIfAvailable(HWND hwnd)
  {
    HMODULE user32_module = LoadLibraryA("User32.dll");
    if (!user32_module)
    {
      return;
    }
    auto enable_non_client_dpi_scaling =
        reinterpret_cast<EnableNonClientDpiScaling *>(
            GetProcAddress(user32_module, "EnableNonClientDpiScaling"));
    if (enable_non_client_dpi_scaling != nullptr)
    {
      enable_non_client_dpi_scaling(hwnd);
      FreeLibrary(user32_module);
    }
  }

} // namespace

// Manages the Win32Window's window class registration.
class WindowClassRegistrar
{
public:
  ~WindowClassRegistrar() = default;

  // Returns the singleton registar instance.
  static WindowClassRegistrar *GetInstance()
  {
    if (!instance_)
    {
      instance_ = new WindowClassRegistrar();
    }
    return instance_;
  }

  // Returns the name of the window class, registering the class if it hasn't
  // previously been registered.
  const wchar_t *GetWindowClass();

  // Unregisters the window class. Should only be called if there are no
  // instances of the window.
  void UnregisterWindowClass();

private:
  WindowClassRegistrar() = default;

  static WindowClassRegistrar *instance_;

  bool class_registered_ = false;
};

WindowClassRegistrar *WindowClassRegistrar::instance_ = nullptr;

const wchar_t *WindowClassRegistrar::GetWindowClass()
{
  if (!class_registered_)
  {
    WNDCLASS window_class{};
    window_class.hCursor = LoadCursor(nullptr, IDC_ARROW);
    window_class.lpszClassName = kWindowClassName;
    window_class.style = CS_HREDRAW | CS_VREDRAW;
    window_class.cbClsExtra = 0;
    window_class.cbWndExtra = 0;
    window_class.hInstance = GetModuleHandle(nullptr);
    window_class.hIcon =
        LoadIcon(window_class.hInstance, MAKEINTRESOURCE(IDI_APP_ICON));
    window_class.hbrBackground = 0;
    window_class.lpszMenuName = nullptr;
    window_class.lpfnWndProc = Win32Window::WndProc;
    RegisterClass(&window_class);
    class_registered_ = true;
  }
  return kWindowClassName;
}

void WindowClassRegistrar::UnregisterWindowClass()
{
  UnregisterClass(kWindowClassName, nullptr);
  class_registered_ = false;
}

Win32Window::Win32Window(HINSTANCE _instance) : hinstance(_instance)
{
  ++g_active_window_count;
}

Win32Window::~Win32Window()
{
  --g_active_window_count;
  Destroy();
}

bool Win32Window::ShowIfAlreadyInstantiated(const std::wstring& title)
{
    auto hwnd = FindWindow(kWindowClassName, title.c_str());
    if (hwnd != nullptr)
    {
        ShowWindow(hwnd, SW_SHOW);
        return true;
    }
    return false;
}

bool Win32Window::CreateAndShow(const std::wstring &title,
                                const Point &origin,
                                const Size &size)
{
  Destroy();

  const wchar_t *window_class =
      WindowClassRegistrar::GetInstance()->GetWindowClass();

  const POINT target_point = {static_cast<LONG>(origin.x),
                              static_cast<LONG>(origin.y)};
  HMONITOR monitor = MonitorFromPoint(target_point, MONITOR_DEFAULTTONEAREST);
  UINT dpi = FlutterDesktopGetDpiForMonitor(monitor);
  auto scale_factor = dpi / 96.0;
  center = Point(Scale(origin.x, scale_factor), Scale(origin.y, scale_factor));
  screenSize = Size(Scale(size.width, scale_factor), Scale(size.height, scale_factor));

  HWND window = CreateWindow(
      window_class, title.c_str(), WS_OVERLAPPEDWINDOW | WS_VISIBLE,
      Scale(origin.x, scale_factor), Scale(origin.y, scale_factor),
      Scale(size.width, scale_factor), Scale(size.height, scale_factor),
      nullptr, nullptr, GetModuleHandle(nullptr), this);

  if (!window)
  {
    return false;
  }

  // initialize notification data
  ZeroMemory(&notifyData, sizeof(NOTIFYICONDATA));
  ULONGLONG ullVersion = GetDllVersion(L"Shell32.dll");
  if (ullVersion >= MAKEDLLVERULL(5, 0, 0, 0))
    notifyData.cbSize = sizeof(NOTIFYICONDATA);
  else
    notifyData.cbSize = NOTIFYICONDATA_V2_SIZE;
  notifyData.uID = 1;
  notifyData.uFlags = NIF_ICON | NIF_MESSAGE | NIF_TIP;
  notifyData.hIcon = (HICON)LoadImage(hinstance, MAKEINTRESOURCE(IDI_APP_ICON),
                                      IMAGE_ICON, GetSystemMetrics(SM_CXSMICON), GetSystemMetrics(SM_CYSMICON),
                                      LR_DEFAULTCOLOR);
  notifyData.hWnd = window;
  notifyData.uCallbackMessage = SWM_TRAYMSG;
  lstrcpyn(notifyData.szTip, L"Imagine Share, share you files!", sizeof(notifyData.szTip) / sizeof(TCHAR));
  Shell_NotifyIcon(NIM_ADD, &notifyData);
  if (notifyData.hIcon && DestroyIcon(notifyData.hIcon))
    notifyData.hIcon = NULL;

  return OnCreate();
}

// static
LRESULT CALLBACK Win32Window::WndProc(HWND const window,
                                      UINT const message,
                                      WPARAM const wparam,
                                      LPARAM const lparam) noexcept
{
  if (message == WM_NCCREATE)
  {
    auto window_struct = reinterpret_cast<CREATESTRUCT *>(lparam);
    SetWindowLongPtr(window, GWLP_USERDATA,
                     reinterpret_cast<LONG_PTR>(window_struct->lpCreateParams));

    auto that = static_cast<Win32Window *>(window_struct->lpCreateParams);
    EnableFullDpiSupportIfAvailable(window);
    that->window_handle_ = window;
  }
  else if (Win32Window *that = GetThisFromHandle(window))
  {
    return that->MessageHandler(window, message, wparam, lparam);
  }

  return DefWindowProc(window, message, wparam, lparam);
}

LRESULT
Win32Window::MessageHandler(HWND hwnd,
                            UINT const message,
                            WPARAM const wparam,
                            LPARAM const lparam) noexcept
{
  int wmId;
  switch (message)
  {
  case SWM_TRAYMSG:
    switch (lparam)
    {
    case WM_LBUTTONDOWN:
      ShowWindow(hwnd, SW_SHOW);
      toggleMinimize = !toggleMinimize;
      auto added = toggleMinimize ? 1 : 0;
      SetWindowPos(hwnd, nullptr,
                   center.x, center.y, screenSize.width + added, screenSize.height,
                   SWP_NOZORDER | SWP_NOACTIVATE);
      break;
    }
    break;
  case WM_SYSCOMMAND:
    wmId = LOWORD(wparam);
    switch (wmId)
    {
    case SC_CLOSE:
      ShowWindow(hwnd, SW_HIDE);
      return 1;
      //case SWM_EXIT:
      //  DestroyWindow(hwnd);
      //  break;
    }
    break;
  case WM_DESTROY:
    window_handle_ = nullptr;
    Destroy();
    if (quit_on_close_)
    {
      PostQuitMessage(0);
    }
    return 0;

  case WM_DPICHANGED:
  {
    auto newRectSize = reinterpret_cast<RECT *>(lparam);
    LONG newWidth = newRectSize->right - newRectSize->left;
    LONG newHeight = newRectSize->bottom - newRectSize->top;

    SetWindowPos(hwnd, nullptr, newRectSize->left, newRectSize->top, newWidth,
                 newHeight, SWP_NOZORDER | SWP_NOACTIVATE);

    return 0;
  }
  case WM_SIZE:
  {
    RECT rect = GetClientArea();
    if (child_content_ != nullptr)
    {
      // Size and position the child window.
      MoveWindow(child_content_, rect.left, rect.top, rect.right - rect.left,
                 rect.bottom - rect.top, TRUE);
    }
    return 0;
  }
  case WM_ACTIVATE:
    if (child_content_ != nullptr)
    {
      SetFocus(child_content_);
    }
    return 0;
  case WM_CLOSE:
    ShowWindow(hwnd, SW_HIDE);
    break;
  }

  return DefWindowProc(window_handle_, message, wparam, lparam);
}

void Win32Window::Destroy()
{
  OnDestroy();
  notifyData.uFlags = 0;
  Shell_NotifyIcon(NIM_DELETE, &notifyData);

  if (window_handle_)
  {
    //DestroyWindow(window_handle_);
    window_handle_ = nullptr;
  }
  if (g_active_window_count == 0)
  {
    WindowClassRegistrar::GetInstance()->UnregisterWindowClass();
  }
}

Win32Window *Win32Window::GetThisFromHandle(HWND const window) noexcept
{
  return reinterpret_cast<Win32Window *>(
      GetWindowLongPtr(window, GWLP_USERDATA));
}

void Win32Window::SetChildContent(HWND content)
{
  child_content_ = content;
  SetParent(content, window_handle_);
  RECT frame = GetClientArea();

  MoveWindow(content, frame.left, frame.top, frame.right - frame.left,
             frame.bottom - frame.top, true);

  SetFocus(child_content_);
}

RECT Win32Window::GetClientArea()
{
  RECT frame;
  GetClientRect(window_handle_, &frame);
  return frame;
}

Win32Window::Point Win32Window::GetWindowCenterPoint(const Win32Window::Size clientSize)
{
  RECT windowRect;
  WindowClassRegistrar::GetInstance()->GetWindowClass();
  GetWindowRect(GetDesktopWindow(), &windowRect);
  auto x = windowRect.right / 2;
  auto y = windowRect.bottom / 2;
  x -= clientSize.width / 2;
  y -= clientSize.height / 2;
  return Win32Window::Point((unsigned int)x, (unsigned int)y);
}

HWND Win32Window::GetHandle()
{
  return window_handle_;
}

void Win32Window::SetQuitOnClose(bool quit_on_close)
{
  quit_on_close_ = quit_on_close;
}

bool Win32Window::OnCreate()
{
  // No-op; provided for subclasses.
  return true;
}

void Win32Window::OnDestroy()
{
  // No-op; provided for subclasses.
}

ULONGLONG Win32Window::GetDllVersion(LPCTSTR lpszDllName)
{
  ULONGLONG ullVersion = 0;
  HINSTANCE hinstDll;
  hinstDll = LoadLibrary(lpszDllName);
  if (hinstDll)
  {
    DLLGETVERSIONPROC pDllGetVersion;
    pDllGetVersion = (DLLGETVERSIONPROC)GetProcAddress(hinstDll, "DllGetVersion");
    if (pDllGetVersion)
    {
      DLLVERSIONINFO dvi;
      HRESULT hr;
      ZeroMemory(&dvi, sizeof(dvi));
      dvi.cbSize = sizeof(dvi);
      hr = (*pDllGetVersion)(&dvi);
      if (SUCCEEDED(hr))
        ullVersion = MAKEDLLVERULL(dvi.dwMajorVersion, dvi.dwMinorVersion, 0, 0);
    }
    FreeLibrary(hinstDll);
  }
  return ullVersion;
}
