namespace ImagineTime
{
    public class UserResponse
    {
        public bool success { get; set; }
        public User user { get; set; }
    }

    public class User
    {
        public int _id { get; set; }
    }
}
