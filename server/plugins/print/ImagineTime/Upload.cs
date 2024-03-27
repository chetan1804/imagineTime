using System.Collections.Generic;

namespace ImagineTime
{
    public class UploadResponse
    {
        public bool success { get; set; }
        public List<Upload> files { get; set; }
    }

    public class Upload
    {
        public int _id { get; set; }
        public string filename { get; set; }
    }
}
