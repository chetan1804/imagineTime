namespace ImagineTime
{
    partial class SelectFirmForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.firmLabel = new System.Windows.Forms.Label();
            this.firmListBox = new System.Windows.Forms.ListBox();
            this.selectFirmButton = new System.Windows.Forms.Button();
            this.errorLabel = new System.Windows.Forms.Label();
            this.SuspendLayout();
            // 
            // firmLabel
            // 
            this.firmLabel.AutoSize = true;
            this.firmLabel.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.firmLabel.Location = new System.Drawing.Point(88, 54);
            this.firmLabel.Name = "firmLabel";
            this.firmLabel.Size = new System.Drawing.Size(101, 20);
            this.firmLabel.TabIndex = 0;
            this.firmLabel.Text = "Select a firm:";
            // 
            // firmListBox
            // 
            this.firmListBox.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.firmListBox.FormattingEnabled = true;
            this.firmListBox.ItemHeight = 20;
            this.firmListBox.Location = new System.Drawing.Point(92, 88);
            this.firmListBox.Name = "firmListBox";
            this.firmListBox.Size = new System.Drawing.Size(250, 104);
            this.firmListBox.TabIndex = 1;
            this.firmListBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(this.FirmListBox_Format);
            // 
            // selectFirmButton
            // 
            this.selectFirmButton.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.selectFirmButton.Location = new System.Drawing.Point(161, 209);
            this.selectFirmButton.Name = "selectFirmButton";
            this.selectFirmButton.Size = new System.Drawing.Size(112, 40);
            this.selectFirmButton.TabIndex = 5;
            this.selectFirmButton.Text = "select";
            this.selectFirmButton.UseVisualStyleBackColor = true;
            this.selectFirmButton.Click += new System.EventHandler(this.SelectFirmButton_Click);
            // 
            // errorLabel
            // 
            this.errorLabel.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.errorLabel.ForeColor = System.Drawing.Color.Tomato;
            this.errorLabel.Location = new System.Drawing.Point(88, 9);
            this.errorLabel.Name = "errorLabel";
            this.errorLabel.Size = new System.Drawing.Size(254, 23);
            this.errorLabel.TabIndex = 6;
            this.errorLabel.TextAlign = System.Drawing.ContentAlignment.TopCenter;
            // 
            // SelectFirmForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(434, 261);
            this.Controls.Add(this.errorLabel);
            this.Controls.Add(this.selectFirmButton);
            this.Controls.Add(this.firmListBox);
            this.Controls.Add(this.firmLabel);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Name = "SelectFirmForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "ImagineTime SecureSend";
            this.TopMost = true;
            this.Load += new System.EventHandler(this.SelectFirmForm_Load);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label firmLabel;
        private System.Windows.Forms.ListBox firmListBox;
        private System.Windows.Forms.Button selectFirmButton;
        private System.Windows.Forms.Label errorLabel;
    }
}