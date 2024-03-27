using System.Collections.Generic;

namespace ImagineTime
{
    public class FirmResponse
    {
        public bool success { get; set; }
        public List<Firm> firms { get; set; }
    }

    public class Firm
    {
        public int _id { get; set; }
        public string name { get; set; }
    }
}