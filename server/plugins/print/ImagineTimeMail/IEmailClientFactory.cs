namespace ImagineTimeMail
{
    public interface IEmailClientFactory
    {
        IEmailClient CreateEmailClient();
    }
}