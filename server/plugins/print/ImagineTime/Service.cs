using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Runtime.Serialization.Formatters.Binary;
using Newtonsoft.Json;

namespace ImagineTime
{
    public static class Service
    {
        private const string appFolder = "ImagineTime";
        private const string cookieStore = "cc";
        private const string firmStore = "f";
        private const string userStore = "u";

        private const string traceSourceName = "ImagineTime";

        private static readonly TraceSource logEventSource = new TraceSource(traceSourceName);

        private static string GetApplicationDataFolder()
        {
            var appDataPath = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            var dataPath = Path.Combine(appDataPath, appFolder);

            if (!Directory.Exists(dataPath))
            {
                Directory.CreateDirectory(dataPath);
            }

            return dataPath;
        }

        public static bool HasAuthenticated()
        {
            var fileCC = Path.Combine(GetApplicationDataFolder(), cookieStore);
            var fileU = Path.Combine(GetApplicationDataFolder(), userStore);

            return File.Exists(fileCC) && File.Exists(fileU);
        }

        public static bool HasSelectedFirm()
        {
            var file = Path.Combine(GetApplicationDataFolder(), firmStore);

            return File.Exists(file);
        }

        public static void SaveFirm(Firm firm)
        {
            try
            {
                var file = Path.Combine(GetApplicationDataFolder(), firmStore);

                using (var stream = File.CreateText(file))
                {
                    logEventSource.TraceEvent(TraceEventType.Information,
                        (int)TraceEventType.Error,
                        "Writing firm to disk...");

                    var serializer = new JsonSerializer();
                    serializer.Serialize(stream, firm);

                    logEventSource.TraceEvent(TraceEventType.Information,
                        (int)TraceEventType.Error,
                        "Complete");
                }
            }
            catch (Exception e)
            {
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int)TraceEventType.Error,
                    $"Problem writing cookies to disk: {e.GetType()}");
            }
        }

        public static Firm LoadFirm()
        {
            try
            {
                var file = Path.Combine(GetApplicationDataFolder(), firmStore);

                using (var stream = File.OpenText(file))
                {
                    logEventSource.TraceEvent(TraceEventType.Information,
                        (int)TraceEventType.Error,
                        "Reading user from disk...");

                    var serializer = new JsonSerializer();
                    var firm = (Firm)serializer.Deserialize(stream, typeof(Firm));

                    logEventSource.TraceEvent(TraceEventType.Information,
                        (int)TraceEventType.Error,
                        "Complete");

                    return firm;
                }
            }
            catch (Exception e)
            {
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int)TraceEventType.Error,
                    $"Problem reading cookies from disk: {e.GetType()}");

                return new Firm();
            }
        }


        public static void SaveUser(User user)
        {
            try
            {
                var file = Path.Combine(GetApplicationDataFolder(), userStore);

                using (var stream = File.CreateText(file))
                {
                    logEventSource.TraceEvent(TraceEventType.Information,
                        (int)TraceEventType.Error,
                        "Writing user to disk...");

                    var serializer = new JsonSerializer();
                    serializer.Serialize(stream, user);

                    logEventSource.TraceEvent(TraceEventType.Information,
                        (int)TraceEventType.Error,
                        "Complete");
                }
            }
            catch (Exception e)
            {
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int)TraceEventType.Error,
                    $"Problem writing cookies to disk: {e.GetType()}");
            }
        }

        public static User LoadUser()
        {
            try
            {
                var file = Path.Combine(GetApplicationDataFolder(), userStore);

                using (var stream = File.OpenText(file))
                {
                    logEventSource.TraceEvent(TraceEventType.Information,
                        (int)TraceEventType.Error,
                        "Reading user from disk...");

                    var serializer = new JsonSerializer();
                    var user = (User)serializer.Deserialize(stream, typeof(User));

                    logEventSource.TraceEvent(TraceEventType.Information,
                        (int)TraceEventType.Error,
                        "Complete");

                    return user;
                }
            }
            catch (Exception e)
            {
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int)TraceEventType.Error,
                    $"Problem reading cookies from disk: {e.GetType()}");

                return new User();
            }
        }

        public static void SaveCookies(CookieContainer cookieJar)
        {
            try
            {
                var file = Path.Combine(GetApplicationDataFolder(), cookieStore);

                using (var stream = File.Create(file))
                {
                    logEventSource.TraceEvent(TraceEventType.Information,
                        (int)TraceEventType.Error,
                        "Writing cookies to disk...");

                    var formatter = new BinaryFormatter();
                    formatter.Serialize(stream, cookieJar);

                    logEventSource.TraceEvent(TraceEventType.Information,
                        (int)TraceEventType.Error,
                        "Complete");
                }
            }
            catch (Exception e)
            {
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int)TraceEventType.Error,
                    $"Problem writing cookies to disk: {e.GetType()}");
            }
        }

        public static CookieContainer LoadCookies()
        {
            try
            {
                var file = Path.Combine(GetApplicationDataFolder(), cookieStore);

                using (var stream = File.Open(file, FileMode.Open))
                {
                    logEventSource.TraceEvent(TraceEventType.Information,
                        (int)TraceEventType.Error,
                        "Reading cookies from disk...");

                    var formatter = new BinaryFormatter();
                    var cookieContainer = (CookieContainer)formatter.Deserialize(stream);

                    logEventSource.TraceEvent(TraceEventType.Information,
                        (int)TraceEventType.Error,
                        "Complete");

                    return cookieContainer;
                }
            }
            catch (Exception e)
            {
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int)TraceEventType.Error,
                    $"Problem reading cookies from disk: {e.GetType()}");

                return new CookieContainer();
            }
        }
    }
}
