using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.IO;

namespace imagine.Checker
{
    public class Util
    {
        /// <summary>
        /// get uri/relative path. the file should be a parent of a valid client folder
        /// </summary>
        /// <param name="path"></param>
        /// <returns>path with only client folder</returns>
        public static string GetRelativePath(string path, string driveLetter)
        {
            return path.Replace(driveLetter, "");
        }

        public static bool TryLoadFromFile(string path, out JObject result)
        {
            return TryLoadFromFile<JObject>(path, out result);
        }

        public static bool TryLoadFromFile<U>(string path, out U result) 
        {
            result = default(U);
            if (!File.Exists(path)) return false;

            var json = File.ReadAllText(path);
            try
            {
                result = JsonConvert.DeserializeObject<U>(json);
                return true;
            }catch (Exception e)
            {
                Console.WriteLine(e);
            }
            return false;
        }
    }
}
