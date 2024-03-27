using System;
using System.Diagnostics;
using System.Windows.Forms;
using RestSharp;

namespace ImagineTime
{
    public partial class LoginForm : Form
    {
        private const string errorNetworkProblem = "Network connection error. Please check your connection and try again.";
        private const string errorRequiredInput = "Enter the required information!";

        private const string traceSourceName = "ImagineTime";

        private static readonly TraceSource logEventSource = new TraceSource(traceSourceName);

        public LoginForm()
        {
            InitializeComponent();
        }

        private void DisplayErrorMessage(string message)
        {
            usernameTextBox.Text = string.Empty;
            passwordTextBox.Text = string.Empty;

            errorLabel.Text = message;
            errorLabel.Visible = true;
        }

        private void LoginButton_Click(object sender, EventArgs e)
        {
            errorLabel.Text = "";
            errorLabel.Visible = false;

            var username = usernameTextBox.Text;
            var password = passwordTextBox.Text;

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                errorLabel.Text = errorRequiredInput;
                errorLabel.Visible = true;

                return;
            }

            var client = new RestClient("https://demo.imaginetime.com")
            {
                CookieContainer = Service.LoadCookies()
            };

            var request = new RestRequest("/api/users/login", Method.POST);
            request.AddParameter("username", username);
            request.AddParameter("password", password);

            var response = client.Execute<UserResponse>(request);

            if (response.IsSuccessful && response.Data != null && response.Data.success)
            {
                // Save the cookies and user for use later.
                Service.SaveCookies(client.CookieContainer);
                Service.SaveUser(response.Data.user);

                this.Close();
            }
            else
            {
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int)TraceEventType.Error,
                    errorNetworkProblem);

                DisplayErrorMessage(errorNetworkProblem);
            }
        }

        private void LoginForm_Load(object sender, EventArgs e)
        {

        }
    }
}
