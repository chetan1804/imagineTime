/**
 * Helper component to display PDFs.
 * Utilizes react-pdf github: https://github.com/wojtekmaj/react-pdf/blob/v3.x/README.md
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

// import third party libraries
import classNames from 'classnames';
import { Document, Page } from 'react-pdf/dist/entry.noworker';

// import Scrollchor from 'react-scrollchor';

// import global components
import Binder from '../Binder.js.jsx';
import brandingName from '../../enum/brandingName.js.jsx';

class PDFTermsServices extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      numPages: null
      , pageNumber: 1
    }
    this._bind(
      '_done'
      , '_onDocumentLoad'
      , 'scrollToBottom'
      , 'handleScroll'
    )
  }

  _onDocumentLoad = ({ numPages }) => {
      this.setState({
      numPages: numPages
    });
  }

  _done() {
    this.setState({
      pageNumber: 1
    })

    if(this.props.onDone) {
      this.props.onDone()
    }
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll, true);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll(event) {

    console.log("event", event);
    console.log("event", event.target.className);

    const className = event.target.className;
    const bottom = event.target.scrollHeight - event.target.scrollTop === event.target.clientHeight;


    if(bottom && className == 'pdf-wrapper') {
      console.log("im at the bottom");
      this.props.onDone();
    }
  }

  scrollToBottom() {
    this.pdfWrapper.scrollTo(0, this.pdfWrapper.scrollHeight);
  }

  render() {
    const { numPages, pageNumber } = this.state;
    const {
      autoScroll
      , controls
      , filePath
      , hidden
      , pdfClasses
      , scale
    } = this.props;
 
    const scrollBtnStyle = {
      position: 'absolute',
      zIndex: '1',
      top: '-35px',
      right: '35px'
    }

    let firmLogo = brandingName.image.logoBlack;
    const brandingNameTitleCapital = brandingName.title.toUpperCase();

    return (
      <div className='pdf-wrapper'
        ref={(el) => { this.pdfWrapper = el; }}
      > 
        <button
          className="yt-btn small info"
          style={scrollBtnStyle}
          onClick={(e) => {this.scrollToBottom()}}
        >
          <span className="-icon"> 
            <i className="fal fa-angle-double-down fa-2x"/> 
          </span>
        </button>
        {/* <Document
          className="-pdf-document"
          file={filePath}
          onLoadSuccess={this._onDocumentLoad}
        >
          <Page
            className="-pdf-page"
            pageNumber={1}
            renderTextLayer={false}
            renderAnnotations={false}
            scale={scale}
          />
          <Page
            className="-pdf-page"
            pageNumber={2}
            renderTextLayer={false}
            renderAnnotations={false}
            scale={scale}
          />
          <Page
            className="-pdf-page"
            pageNumber={3}
            renderTextLayer={false}
            renderAnnotations={false}
            scale={scale}
          />
          <Page
            className="-pdf-page"
            pageNumber={4}
            renderTextLayer={false}
            renderAnnotations={false}
            scale={scale}
          />
          <Page
            className="-pdf-page"
            pageNumber={5}
            renderTextLayer={false}
            renderAnnotations={false}
            scale={scale}
          />
          <Page
            className="-pdf-page"
            pageNumber={6}
            renderTextLayer={false}
            renderAnnotations={false}
            scale={scale}
          />
                    <Page
            className="-pdf-page"
            pageNumber={7}
            renderTextLayer={false}
            renderAnnotations={false}
            scale={scale}
          />
          <Page
            className="-pdf-page"
            pageNumber={8}
            renderTextLayer={false}
            renderAnnotations={false}
            scale={scale}
          />
          <Page
            className="-pdf-page"
            pageNumber={9}
            renderTextLayer={false}
            renderAnnotations={false}
            scale={scale}
          />
        </Document> */}
        <div>
          <div style={{maxWidth: "90%", margin: 'auto'}}>
            <img src={firmLogo} />
          </div>
          <div className='pages'>
            <div>
              <strong>
                APPLICABLE TO ALL NEW SUBSCRIBERS TO {brandingNameTitleCapital}, INC. SOFTWARE
              </strong>
              <br/>
              <br/>
              <strong>
                {brandingNameTitleCapital}, INC. SOFTWARE SUBSCRIPTION AGREEMENT
              </strong>
              <br/>
              <br/>
              This Agreement is a subscription contract for services setting forth the terms and conditions of the license to use
              {brandingName.title} Cloud Software as defined below. Additional terms and restrictions as to use of the Cloud Software by Licensee
              are contained in the respective {brandingName.title}, Inc. (hereinafter {brandingName.title}) End-User License Subscription Agreement(s)
              and are incorporated herein by reference. It is understood that this Agreement shall have been executed by a person having
              the legal capacity to bind the firm and its partners, associates, shareholders or members. This Agreement is terminable by
              either {brandingName.title} or Licensee pursuant to the terms contained herein and, unless otherwise terminated consistent
              herewith, shall automatically renew from month-to-month or year-to-year (as applicable).
              <br/>
              <br/>
              CLOUD SOFTWARE: The term “Cloud Software” shall mean any computer software, electronic files, or access to the same
              through a web-based portal provided by {brandingName.title} to Licensee under the terms of this Agreement.
              <br/>
              <br/>
              LICENSEE: The term “Licensee” shall mean the individual customer to whom is granted the License(s) under the terms of
              this Agreement.
              <br/>
              <br/>
              CONTACT PERSON: The term “Contact Person” shall mean the person designated by the Licensee, if another, to receive all
              notices or other information regarding or affecting the License(s) or the Cloud Software. Licensee agrees to provide to
              {brandingName.title} with the name, address, telephone number and email address of said Contact Person and any changes thereto.
              <br/>
              <br/>
              PAYMENT TERMS AND TERMINATION: This subscription contract for services is payable by means of a Subscription Fee,
              which fee shall be chargeable and accrue on or about the same business day of each year or month (as applicable) until
              termination of this Agreement by {brandingName.title} or until Licensee notifies {brandingName.title} of, and {brandingName.title} receives, notice
              of termination by Licensee in writing. Payment of Subscription Fees shall be made automatically by means of a charge by
              {brandingName.title} against Licensee’s bank debit or credit card account, and Licensee agrees to keep said account current and in
              good standing such that charges against same may be collected; and further, to provide {brandingName.title} promptly of any
              change in account number, date of expiration or any other information necessary to ensure uninterrupted processing of
              said payment. {brandingName.title} is not obligated to prorate or to refund any accrued Subscription Fees. Subscription Fees are
              due and payable to {brandingName.title} at its offices in Rutherfordton, North Carolina, in advance and without demand (hereinafter
              “Due Date”). Any Subscription Fees that are due and payable to, and not received by, {brandingName.title} by the Due Date shall
              be considered delinquent. {brandingName.title} retains the right to, and shall, terminate Licensee’s access to the Cloud Software in
              the event that Licensee is delinquent as defined above. AN ACTIVE SUBSCRIPTION IS REQUIRED IN ORDER TO USE THE
              CLOUD SOFTWARE OR TO OBTAIN TECHNICAL SUPPORT, INCLUDING, BUT NOT LIMITED TO, ACTIVATION, RE-ACTIVATION,
              REGISTRATION, RE-REGISTRATION AND AUTHORIZED TRANSFER BY LICENSEE OF THE CLOUD SOFTWARE TO ANOTHER
              USER, AND TERMINATION OF LICENSEE’S SUBSCRIPTION FOR ANY REASON SHALL FORTHWITH SERVE TO DENY ACCESS TO
              THE CLOUD SOFTWARE AND TO THE SERVICES AS AFORESAID.
              <br/>
              <br/>
              ADDITIONAL TERMS
              <br/>
              <br/>
              UPDATES: Except as otherwise provided in this Agreement, while this Agreement is in effect, {brandingName.title} shall provide the
              most current version of the Cloud Software to Licensee during the term of this Agreement. Additional components may
              become available, and changes, modifications, additions or removals of components, generally for the purpose of increased
              functionality, may be provided to Licensee, at no additional charge or for an additional charge, as determined by
              {brandingName.title}, in its sole discretion, from time to time.
              <br/>
              <br/>
              ADDITIONAL SERVICES: {brandingName.title} provides training materials accessible within the Cloud Software and online at
              {brandingName.url}. {brandingName.title} offers unlimited customer support relative to the Cloud Software at no additional
              charge to current Licensees. {brandingName.title} reserves the right to change, add or remove items from the list of Additional
              Services, whether free or chargeable, or to charge a fee for any Additional Service prior to its delivery and to deny the
              Additional Service to any Licensee for any reason in the sole discretion of {brandingName.title}. These and other services may be
              offered to Licensee by mail, electronic mail, text messaging, telephone, facsimile, by means of the {brandingName.title} web site or
              by any other method, at the sole discretion of {brandingName.title}.
              <br/>
              <br/>
              GRANT OF LICENSE: {brandingName.title} grants to Licensee such number of licenses to use the Cloud Software as to which Licensee
              shall subscribe. One license is required for each authorized Account to the Cloud Services. Additional licenses may be added
              to Licensee’s Subscription Fee. In the event that Subscription Fee payments are not received as provided for in this
              Agreement, {brandingName.title} may revoke the Grant of License in this Agreement without further notice to Licensee.
              <br/>
              <br/>
              LIMITED WARRANTY: THIS CLOUD SOFTWARE IS PROVIDED “AS IS,” AND TO THE MAXIMUM EXTENT PERMITTED BY
              APPLICABLE LAW, {brandingNameTitleCapital} DISCLAIMS ALL WARRANTIES, EXPRESSED OR IMPLIED, INCLUDING, BUT NOT LIMITED TO,
              IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE AND ANY WARRANTY AGAINST
              INFRINGEMENT, WITH REGARD TO THE SERVICES. THE ENTIRE RISK RELATED TO THE QUALITY AND PERFORMANCE OF THE
              CLOUD SOFTWARE IS ON THE LICENSEE. THIS LIMITED WARRANTY GIVES LICENSEE SPECIFIC LEGAL RIGHTS. LICENSEE MAY
              HAVE OTHERS, WHICH VARY FROM STATE/JURISDICTION TO STATE/JURISDICTION. In the event {brandingName.title} fails to remedy
              material defects in the Cloud Software, Licensee’s exclusive remedy shall be, at {brandingName.title} option, either (a) to receive
              a refund not to exceed the Subscription Fee paid hereunder for the current term of the Agreement, or (b) to correct the
              Cloud Software at {brandingName.title} sole expense.
              <br/>
              <br/>
              NO LIABILITY FOR DAMAGES: TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL
              {brandingNameTitleCapital} BE LIABLE FOR ANY DAMAGES WHATSOEVER (INCLUDING, WITHOUT LIMITATION, DAMAGES FOR LOSS OF
              BUSINESS PROFITS, BUSINESS INTERRUPTION, LOSS OF BUSINESS INFORMATION, OR ANY OTHER PECUNIARY LOSS) ARISING
              OUT OF THE USE OF, OR INABILITY TO USE, THE CLOUD SOFTWARE, EVEN IF {brandingNameTitleCapital} HAS BEEN ADVISED OF THE
              POSSIBILITY OF SUCH DAMAGES. BECAUSE SOME STATES/JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION
              OF LIABILITY FOR CONSEQUENTIAL OR INCIDENTAL DAMAGES, THE ABOVE LIMITATION MAY NOT APPLY TO LICENSEE.
              <br/>
              <br/>
              GENERAL: In the event the terms of this Agreement conflict with any other representations, either express or implied, made
              by any person or contained within any materials supplied by {brandingName.title}, the provisions of this Agreement shall prevail.
              All prices and terms are subject to change and {brandingName.title} reserves the right to increase Licensee’s Subscription Fee rate
              upon written notice to Licensee given not less than sixty (60) days prior to the effective date thereof. This Agreement shall
              be governed by and construed in accordance with the laws of the State of North Carolina. If any provision of this Agreement
              is held by a court of competent jurisdiction to be illegal, invalid or unenforceable then the provision shall be severed, and
              the other provisions shall remain in full force and effect. Venue for any cause of action arising under or in connection with
              this Agreement shall be Rutherford County, North Carolina, for state law matters and the Western District of North Carolina,
              for federal law matters. Licensee’s acceptance of this Agreement constitutes express written consent for {brandingName.title} to
              send information to Licensee or Licensee’s designee for any purpose via facsimile transmission or by text messaging to any
              wireless device number that Licensee or Licensee’s designee provides to {brandingName.title}, and constitutes express written
              consent for {brandingName.title} to contact Licensee or Licensee’s designee via telephone or electronic mail, or via any wireless
              telephone number that Licensee or Licensee’s designee provides to {brandingName.title}. Failure by {brandingName.title} to exercise any
              of its rights under this Agreement shall not be construed as to waive {brandingName.title} ability to exercise such rights thereafter.
              <br/>
              <br/>
              <strong>{brandingNameTitleCapital} END USER LICENSE AGREEMENT </strong>
              <br/>
              <br/>
              PLEASE CAREFULLY REVIEW THE FOLLOWING END USER LICENSE AGREEMENT OF {brandingNameTitleCapital}, INC. (HEREINAFTER
              “{brandingName.title}”) AND ANY AND ALL TERMS OF USE THAT REFERENCE THIS AGREEMENT (HEREINAFTER, THE “Agreement”).
              THIS AGREEMENT IS A LEGALLY BINDING CONTRACT BETWEEN SUBSCRIBER AND {brandingNameTitleCapital}. THIS AGREEMENT
              EXPRESSLY INCORPORATES ANY AND ALL TERMS OF USE THAT REFERENCE THIS AGREEMENT. THIS AGREEMENT GOVERNS 
              <br/>
              <br/>
              ALL USE OF {brandingNameTitleCapital}’S RANGE OF CLOUD SOFTWARE, CLOUD SERVICES, AND ANY ASSOCIATED DOCUMENTATION,
              BOTH ONLINE AND OFFLINE.
              <br/>
              <br/>
              BY CLICKING “I AGREE” OR BY USING THE CLOUD SOFTWARE OR CLOUD SERVICES, SUBSCRIBER CONSENTS TO ALL OF THE
              TERMS AND CONDITIONS SET FORTH IN THIS AGREEMENT. IF SUBSCRIBER DOES NOT AGREE TO ANY OF THE TERMS OF
              THIS AGREEMENT, SUBSCRIBER SHALL IMMEDIATELY STOP USING THE CLOUD SERVICES AND / OR CLOUD SOFTWARE.
              IN THE EVENT OF ANY CONFLICT BETWEEN THIS AGREEMENT AND ANY TERMS OF USE, THE TERMS OF THIS AGREEMENT
              SHALL PREVAIL AND CONTROL.
              <br/>
              <br/>
              {brandingName.title} may modify the terms of this Agreement from time to time and shall post the most current version at
              www.{brandingName.title}.com; it is Subscriber’s responsibility to monitor and stay informed of any changes that Subscriber’s
              continued use of the Cloud Software and/or Cloud Services following modification of this Agreement shall constitute and
              Subscriber herewith consents to be bound by the modified Agreement.
              <br/>
              <br/>
              1. DEFINITIONS:
              <br/>
              <br/>
              “Account” means the account located upon the Infrastructure, created and maintained by Subscriber in order to access the
              Cloud Services, containing information provided by Subscriber and protected by a username and password designated by
              Subscriber.
              <br/>
              <br/>
              “Cloud Services” include (i) access to Cloud Software (as defined herein), (ii) technical and customer support (as described
              herein), (iii) backups (as described herein), and (iv) any documentation both on- and offline, as well as any modifications,
              derivatives, updates or upgrades as may be offered by {brandingName.title} from time to time, and which are subscribed to by the
              Subscriber via a Subscription.
              <br/>
              <br/>
              “Cloud Software” means any {brandingName.title} software which is accessed by the Subscriber using a web-based portal provided
              by {brandingName.title}.
              <br/>
              <br/>
              “Device” means Apple®, Windows® or non- Windows servers, workstations, computers or any mobile devices upon which
              or through which the Cloud Services are used.
              “Infrastructure” means the technical systems, hardware, website, and all connected devices of {brandingName.title} or its third
              party suppliers.
              <br/>
              <br/>
              “Order” means the agreement to subscribe to Cloud Services as between Subscriber and {brandingName.title}.
              <br/>
              <br/>
              “Subscriber” means an individual to which Cloud Services are provided by and as agreed to by {brandingName.title}.
              <br/>
              <br/>
              “Subscription” means the non-exclusive, non-transferable right to use the Cloud Services as ordered by Subscriber, subject
              to the terms of this Agreement and the full and timely payment of the Subscription Fees.
              <br/>
              <br/>
              “Subscription Fees” means the fees payable in respect of an Order.
              <br/>
              <br/>
              2. SUBSCRIPTION: Subject to the terms and conditions of this Agreement, Subscriber may use the Cloud Services only in
              accordance with any written communication by {brandingName.title} to Subscriber, including any then-current product
              documentation as posted on www.{brandingName.title}.com from time to time. A Subscriber may choose to subscribe to one or
              more Cloud Services under his or her Subscription as may be offered by {brandingName.title} from time to time. {brandingName.title} shall
              make commercially reasonable efforts to provide the Cloud Services to Subscriber. This Agreement applies to the Subscriber
              who uses the Cloud Services on one or more Devices as owned, operated or overseen by Subscriber to facilitate the
              provision of services as provided to Subscriber by {brandingName.title}. Throughout the Subscription Period, unless terminated in accordance with the terms herein, {brandingName.title} grants Subscriber the following rights only if Subscriber complies with all
              of the terms of this Agreement.
              <br/>
              <br/>
              The Subscription begins at the time the Subscriber’s Subscription is activated by {brandingName.title} (other than on a trial basis)
              and thereafter continues in effect until the date of termination as set forth hereinafter. A Subscription occurs on a monthly
              or yearly basis; the minimum length of this Agreement is one (1) month. Set-up costs are included in the initial Subscription
              Fee. Recurring charges for Cloud Services provided following the initial Subscription period will be billed, owed, and due
              monthly or annually (as applicable). A Subscription may terminate in whole or in part due to (i) Subscriber’s cancellation or
              (ii) breach of any of terms of this Agreement including non-payment of any Fees when due or (iii) at {brandingName.title} sole
              discretion.
              <br/>
              <br/>
              After the initial Subscription period, cancellation may occur with thirty (30) days’ notice in writing, or by phone with an
              email confirmation. Should the Subscriber require a copy of the data file upon termination, a desktop version of the
              {brandingName.title} software may be purchased at the then-current rates listed on {brandingName.url}. Subscription Fees are
              non-refundable if Subscriber cancels or if the Subscription is terminated for cause. As of the effective date of cancellation
              or termination Subscriber shall no longer be able and shall have no further right to access or use the particular Cloud Services
              which have been canceled or terminated. All licenses granted hereunder shall be month-to-month or year-to-year (as
              applicable) licenses and shall self-renew and self-extend from month-to-month or year-to-year (as applicable) unless and
              until Subscriber notifies {brandingName.title} in writing or via email actually received by {brandingName.title} of Subscriber’s intent to
              cancel.
              <br/>
              <br/>
              Subscription fees shall be chargeable and accrue on or about the same business day of each month or year (as applicable)
              until cancellation of this Agreement by either Party. Payment of Subscription Fees shall be made automatically by means of
              a charge by {brandingName.title} against Subscriber’s bank debit or credit card account, and Subscriber agrees to keep said account
              current and in good standing such that charges against same may be collected; and further, to provide {brandingName.title}
              promptly of any change in account number, date of expiration or any other information necessary to ensure uninterrupted
              processing of said payment. {brandingName.title} is not obligated to prorate or to refund any accrued Subscription Fees.
              Subscription Fees are due and payable to {brandingName.title} at its offices in Rutherfordton, North Carolina, in advance and
              without demand (hereinafter “Due Date”). Any Subscription Fees that are due and payable to, and not received by,
              {brandingName.title} by the Due Date shall be considered delinquent. {brandingName.title} retains the right to, and shall, terminate
              Subscriber’s access to the Software in the event that Subscriber is delinquent as defined above. {brandingName.title} may charge a
              fee for reinstatement of suspended or terminated accounts. Subscriber agrees that until the Subscription to the Cloud
              Services is terminated, Subscriber will continue to accrue charges for which Subscriber remain responsible, even if
              Subscriber does not use the Cloud Services. In the event legal action is necessary to collect on balances due, Subscriber
              agrees to reimburse {brandingName.title} for all expenses incurred to recover sums due, including attorney fees and other legal
              expenses. AN ACTIVE SUBSCRIPTION IS REQUIRED IN ORDER TO USE THE CLOUD SERVICES OR TO OBTAIN TECHNICAL
              SUPPORT, INCLUDING, BUT NOT LIMITED TO, ACTIVATION, RE-ACTIVATION, REGISTRATION OR RE-REGISTRATION AND
              AUTHORIZED TRANSFER BY SUBSCRIBER OF THE CLOUD SERVICES TO ANOTHER USER, AND TERMINATION OF SUBSCRIBER’S
              SUBSCRIPTION FOR CLOUD SERVICES FOR ANY REASON SHALL FORTHWITH SERVE TO DENY ACCESS TO THE CLOUD
              SOFTWARE AND CLOUD SERVICES AS AFORESAID.
              <br/>
              <br/>
              3. GRANT OF RIGHT OF USE: The Cloud Services are licensed and not sold. During a Subscription period and subject to the
              due payment by Subscriber and receipt by {brandingName.title} of all due and payable Subscription Fees, {brandingName.title} grants
              Subscriber a revocable, limited, non-transferable, non-exclusive license to access {brandingName.title}’s Cloud Software and use
              the Cloud Service pursuant to the terms of this Agreement. This Agreement covers any updates, new releases or
              enhancement(s) of the Cloud Services, which {brandingName.title} may make available to Subscriber from time to time.
              <br/>
              <br/>
              4. ACCOUNT; SECURITY: {brandingName.title} respects Subscriber’s privacy and the terms of {brandingName.title}‘s Privacy Policy can be
              found at www.{brandingName.title}.com.To access and use the Cloud Services, Subscriber must create an account that is protected
              by a username and password (hereinafter ”Account”) and Subscriber must keep any passwords and other Account details
              secret. Subscriber agrees to provide {brandingName.title} with accurate and complete information when registering for an Account
              and at all times thereafter. {brandingName.title} must be promptly notified if changes to Subscriber’s information shall occur.
              <br/>
              <br/>
              Subscriber is solely responsible for access to, content in, maintaining the confidentiality of, or sharing and use of its Account.
              A Subscriber shall not transfer or share its Account or Account information with anyone, and {brandingName.title} reserves the right
              to immediately terminate the Account in the event of any unauthorized transfer or sharing thereof. {brandingName.title} shall not
              be liable for any loss or damage arising from any access to, content in, or sharing and use of Subscriber’s Account. In the
              event that Subscriber believes or suspects there has been any unauthorized access to the Account, Subscriber must notify
              {brandingName.title} immediately.
              <br/>
              <br/>
              5. USAGE: This Agreement provides for one distinct user per Account. Additional users may be added by purchasing
              additional Subscriptions at the then-current rates found at {brandingName.url}. New users starting after payment of the
              initial Subscription Fee will be charged a pro-rated Subscription Fee for the remainder of the Subscription period.
              Subscription Fees are subject to change, but will be preceded by a 60-day notification of the planned change.
              <br/>
              <br/>
              All {brandingName.title} software is to remain on the Infrastructure. Copying or downloading of Cloud Software or other
              {brandingName.title} materials, in whole or in part, is strictly prohibited. The Cloud Services described herein are separate and
              distinct from any rights or obligations of Subscriber or {brandingName.title} associated with any desktop license/software Subscriber
              may purchase from {brandingName.title} at any given time. Subscriber may, upon termination of services under this Agreement,
              revert to use of its desktop license, if any.
              <br/>
              <br/>
              Subscriber acknowledges that {brandingName.title} may establish general practices and limits concerning use of the Cloud Services,
              including without limitation the maximum number of days that uploaded content will be retained, the maximum disk space
              that will be allotted on the Infrastructure on Subscriber’s behalf, and the maximum number of times (and the maximum
              duration for which) Subscriber may access the Cloud Services in a given period of time. Subscriber agrees that {brandingName.title}
              has no responsibility or liability for the deletion or failure to store any content maintained or transmitted on or through the
              Infrastructure.
              <br/>
              <br/>
              6. BACKUPS: {brandingName.title} shall maintain nightly rolling backups of the last seven (7) days. {brandingName.title} has no obligation
              to retain any Subscriber information or provide any backup services other than as expressly stated herein. {brandingName.title} will
              assist in the restoration of any backup, as may be reasonably requested by Subscriber.
              <br/>
              <br/>
              7. AVAILABILITY OF CLOUD SERVICES: {brandingName.title} makes reasonable assurances that the Cloud Services will be available
              24/7, but cannot guarantee system outages outside {brandingName.title}’s control will not occur. Subscriber understands and
              agrees that temporary interruptions of the Cloud Services available through this Agreement may occur as normal events,
              and in such cases, {brandingName.title} shall have no liability to Subscriber for any damages resulting from such outages. In the case
              of outage, {brandingName.title} will use commercially reasonable efforts to provide alternative access to Cloud Services within 24
              hours. {brandingName.title} will notify Subscriber (via email, preferably) regarding any planned outages, due to upgrades or
              Infrastructure maintenance.
              <br/>
              <br/>
              {brandingName.title} may, in its sole discretion and for reasons not related to Subscriber conduct, terminate Subscriber access to
              all or part of the Cloud Services, or discontinue the Cloud Services entirely with or without notice. In the event {brandingName.title}
              terminates the Cloud Services or this Agreement without cause, {brandingName.title} will provide Subscriber with a desktop
              license/software version of the {brandingName.title} software at no additional charge and aid in the transfer of any data, as needed,
              to the desktop software, at Subscriber’s request. Any technical support must be purchased at the then-current rates listed
              on {brandingName.url}. In the event the Subscriber declines to install the desktop software, a copy of the data file will
              be provided at no charge to the Subscriber.
              <br/>
              <br/>
              8. SUPPORT: During a Subscription period, {brandingName.title} will provide Subscriber with the support described in this paragraph
              (hereinafter “Support”) on a local office’s business hours basis which shall ordinarily be from 9 AM through 6 PM ET, Monday
              through Friday. In {brandingName.title}‘s sole determination, Support shall consist of: (i) telephone or electronic support to
              Subscriber in order to help Subscriber locate and, on Subscriber’s own, correct problems with the Cloud Services and/or (ii)
              supplying extensions, enhancements and other changes that {brandingName.title} may make to the Cloud Services from time to
              time and which are made publicly available, without additional charge, to other Subscribers of the Cloud Services that are
              entitled to Support. {brandingName.title} shall provide incident-specific customer support regarding the use of the {brandingName.title}
              Practice Management software. A support incident is understood to be limited to a specific question about how to
              implement or use a feature. Support technicians may direct the user to video presentations about feature implementation,
              where appropriate. Support is generally available during {brandingName.title}’s regular business days/hours. More in-depth,
              focused one-hour training sessions can be purchased by Subscriber at the then current rate listed on the {brandingName.title}
              Website. 
              <br/>
              <br/>
              9. SUBSCRIBER’S CONDUCT; CONTENT OF DATA: Subscriber must comply at all times with any and all applicable local, state,
              federal and international laws and treaties. Subscriber warrants that it has obtained sufficient consent and rights (i) to
              access any third Party’s or End User’s systems or networks, and (ii) to access, use and store all data and files on the
              Infrastructure or otherwise use via the Cloud Services such data and files. {brandingName.title} may, in its sole discretion, terminate
              or suspend Subscriber access to all or part of the Cloud Services with or without notice, following Subscriber’s breach of
              this Agreement. Further, any suspected fraudulent, abusive or illegal activity may be grounds for terminating Subscriber’s
              access to Cloud Services. Upon termination or suspension, regardless of the reasons therefore, Subscriber’s right to use the
              Cloud Services shall immediately cease, and Subscriber acknowledges and agrees that {brandingName.title} may immediately
              deactivate or delete its Account and all related information and files in its Account and/or bar any further access to such
              Cloud Services or the Infrastructure. In such event, {brandingName.title} shall not be liable to Subscriber or any third party for any
              claims or damages arising out of any termination or suspension or any other actions taken by {brandingName.title} in connection
              therewith. Subscriber acknowledges that {brandingName.title} has no knowledge of, and is in no way responsible for, any of the
              content of Subscriber’s data or files.
              <br/>
              <br/>
              10. DATA PROTECTION: Each of {brandingName.title} and Subscriber shall comply with its respective obligations under applicable
              data protection laws. Neither party shall do any act that puts the other party in breach of its obligations, nor shall anything
              in this Agreement be deemed to prevent any party from taking any action it reasonably deems necessary to comply with
              data protection laws. Subscriber agrees that during the course of this Agreement: (i) with respect to data Subscriber collects,
              accesses or otherwise uses, Subscriber alone shall determine the purposes for which and the manner in which such data
              are, or will be, processed; and (ii) Subscriber is the data controller with respect to all such data Subscriber may process.
              <br/>
              <br/>
              {brandingName.title} shall at all times be in accordance with the requirements of data protection laws and Subscriber shall fully
              indemnify and hold {brandingName.title} harmless as against any loss, damages, liability and costs (including attorney’s fees)
              incurred by {brandingName.title} as a result of any breach of data protection laws by Subscriber.
              {brandingName.title} shall comply with requests for information from legitimate judicial, legal or regulatory authorities or pursuant
              to any court order or subpoena, discovery request or other lawful process that {brandingName.title} may receive. {brandingName.title} may
              comply with these subpoenas or court orders with or without notice to Subscriber.
              <br/>
              <br/>
              11. RESTRICTIONS: Except as otherwise expressly provided under this Agreement, Subscriber shall have no right and
              Subscriber shall not permit any third party to: (i) harm, disrupt or otherwise engage in activity that diminishes the
              {brandingName.title} brand, Cloud Services, or Infrastructure; (ii) use the Cloud Services in a manner that shall result in excessive
              bandwidth or storage or shall exceed any permitted usage as solely determined by {brandingName.title}; (iii) transfer, assign or
              sublicense the limited rights granted to Subscriber in this Agreement to any other person or entity, or use the Cloud Services
              other than as authorized, and any such attempted transfer, assignment, sublicense or unauthorized use shall be void; (iv)
              make error corrections to or otherwise modify or adapt the Services or decompile, decrypt, disassemble, reverse engineer
              or attempt to reconstruct or discover any source code or underlying ideas, algorithms, file formats or programming or
              interoperability interfaces of the Services or of any files contained or generated using the Services by any means whatsoever
              or otherwise reduce the Services to human-readable form, except to the minimum extent expressly permitted under
              applicable law notwithstanding this restriction; or (v) attempt to alter, circumvent or provide the method or means to
              circumvent any disabling mechanism in the Cloud Services; or (vi) use the Cloud Services in any manner not expressly
              authorized herein; or (vii) alter, remove or fail to reproduce any proprietary notices from the Cloud Services; or (viii)
              misrepresent any person or entity’s identity, impersonate any person or attempt to gain access to any Account, the
              Infrastructure or the networks or property of any third person, without authorization.
              <br/>
              <br/>
              12. INTELLECTUAL PROPERTY RIGHTS: The Cloud Services are protected by world-wide copyright, trademark, patent and
              other intellectual property laws and treaties and belong to {brandingName.title}, its licensors and any applicable {brandingName.title} agent
              and third-Party contractor. Subscriber acknowledges (i) that rights in the Cloud Services are licensed and not sold to
              Subscriber; (ii) that Subscriber shall have no rights or title in or to the Cloud Services other than the right to use them in
              accordance with the terms of this Agreement; and (iii) that Open Source and/or third party software may be incorporated
              into the Cloud Services provided by {brandingName.title}. {brandingName.title}, its licensors and any applicable third parties, own all title,
              copyright and other intellectual property rights in and to the Cloud Services. The Cloud Services, in all formats existing, are
              a trade secret of and proprietary to {brandingName.title}, its suppliers and/or licensors, including but not limited to, the specific
              internal code, design and structure of individual programs and software, the display and associated interface information.
              Subscriber shall not disclose the confidential aspects of the Cloud Services to unauthorized third parties.
              <br/>
              <br/>
              13. THIRD PARTY COMPONENTS: Part of the Cloud Services may incorporate third party proprietary services and/or
              software. If and to the extent such third party services and/or software are an integral part of the Cloud Services, such third
              parties shall be deemed {brandingName.title} Agents and the terms of this Agreement shall apply to such {brandingName.title} Agents. If
              and to the extent Subscriber contracts independently with independent third parties, the terms of such third party contract
              shall apply to the relationship between Subscriber and such independent contractor and {brandingName.title} shall have no liability
              with respect thereto. In addition, part of the Cloud Services may incorporate and consist of third party open source software
              (hereinafter “Open Source”), which Subscriber may use under the terms and conditions of the specific license under which
              the Open Source software is distributed. Subscriber agrees that Subscriber will be bound by any and all such license
              agreements. Title to software remains with the applicable licensor(s). Any Open Source software provided with or contained
              in the Cloud Services is provided AS IS and without any warranty of any kind.
              <br/>
              <br/>
              14. SERVICE EVALUATIONS AND FREEWARE: With {brandingName.title}‘s consent Subscriber may evaluate the Cloud Services for
              up to thirty (30) days at no cost. Subscriber may evaluate the Cloud Services only to determine whether to license the Cloud
              Services. Subscriber may only evaluate the Cloud Services once. At the end of the evaluation period, Subscriber must either
              license the Cloud Services or cease all use of such Cloud Services. Subscriber’s use of the Cloud Services during an evaluation
              period or for any Service that is offered as freeware shall be without warranty of any kind and is provided AS IS. {brandingName.title}
              has no duty to provide support to Subscriber during any evaluation period or for any Service offered as freeware but may
              do so at its sole discretion.
              <br/>
              <br/>
              15. DISCLAIMER OF WARRANTIES: THE CLOUD SERVICES ARE PROVIDED TO SUBSCRIBER ON AN AS IS AND ON AN AS IS
              AVAILABLE BASIS. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THIS WARRANTY AND THE REMEDIES
              HEREIN ARE EXCLUSIVE AND IN LIEU OF ALL OTHER WARRANTIES AND REMEDIES, WHETHER ORAL, EXPRESS, IMPLIED OR
              STATUTORY INCLUDING, WITHOUT LIMITATION, WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE,
              MERCHANTABILITY, WARRANTIES FOR LATENT OR HIDDEN DEFECTS. {brandingNameTitleCapital} DOES NOT WARRANT THAT THE
              SPECIFICATIONS OR FUNCTIONS CONTAINED IN THE CLOUD SERVICES WILL MEET SUBSCRIBER’S REQUIREMENTS, OR THAT
              THE OPERATION OF THE CLOUD SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE, OR THAT DEFECTS IN THE CLOUD
              SERVICES WILL BE CORRECTED. FURTHERMORE, {brandingNameTitleCapital} DOES NOT WARRANT OR MAKE ANY REPRESENTATIONS
              REGARDING THE USE OR THE RESULTS OF THE USE OF THE CLOUD SERVICES PROVIDED WITH RESPECT TO CORRECTNESS,
              ACCURACY, RELIABILITY, OR OTHERWISE. IF THIS EXCLUSION IS NOT PERMITTED BY LAW, {brandingNameTitleCapital} LIMITS ANY
              EXPRESS, STATUTORY OR IMPLIED WARRANTIES AS TO DURATION TO THE EXTENT OF THIS LIMITED WARRANTY AND THE
              REPAIR OR REPLACEMENT REMEDY AS DETERMINED BY {brandingNameTitleCapital} IN ITS SOLE DISCRETION.
              <br/>
              <br/>
              16. LIMITATION OF LIABILITY: TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL
              {brandingNameTitleCapital} OR {brandingNameTitleCapital}’S AGENTS BE LIABLE FOR ANY SPECIAL, INCIDENTAL, INDIRECT OR CONSEQUENTIAL
              DAMAGES WHATSOEVER (NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS OR CONFIDENTIAL OR OTHER INFORMATION,
              FOR BUSINESS INTERRUPTION, FOR PERSONAL INJURY, FOR LOSS OF PRIVACY, FOR FAILURE TO MEET ANY DUTY INCLUDING
              OF GOOD FAITH OR OF REASONABLE CARE, FOR NEGLIGENCE AND FOR ANY OTHER PECUNIARY OR OTHER LOSS
              WHATSOEVER) ARISING OUT OF OR IN ANY WAY RELATED TO THE USE OF OR INABILITY TO USE THE CLOUD SERVICES, THE
              PROVISION OF OR FAILURE TO PROVIDE SUPPORT SERVICES, OR OTHERWISE UNDER OR IN CONNECTION WITH ANY
              PROVISION OF THIS AGREEMENT, UNDER ANY THEORY OF LAW OR FAULT OF {brandingNameTitleCapital} OR ANY OF {brandingNameTitleCapital}’S
              AGENTS, AND EVEN IF {brandingNameTitleCapital} OR ANY OF {brandingNameTitleCapital}’S AGENTS SHALL HAVE BEEN ADVISED OF THE POSSIBILITY
              OF SUCH DAMAGES. THIS LIMITATION SHALL NOT APPLY TO DEATH OR PERSONAL INJURY CLAIMS. {brandingNameTitleCapital} EXCLUDES
              ANY LIABILITY FOR FAILURE TO REPAIR ANY CLOUD SERVICES. NOTWITHSTANDING THE FOREGOING, THE MAXIMUM
              LIABILITY THAT {brandingNameTitleCapital} SHALL INCUR HEREUNDER SHALL BE LIMITED TO THE ACTUAL PRICE PAID BY SUBSCRIBER
              FOR THE RESPECTIVE SERVICE FOR THE AGREEMENT TERM EMBRACING THE DATE WHEN THE APPLICABLE CLAIM AROSE.
              <br/>
              <br/>
              17. INDEMNIFICATION: Subscriber agrees to indemnify, defend and hold {brandingName.title} and {brandingName.title}’s agents harmless
              from and against any and all damages, fines, penalties, assessments, liabilities, losses, costs and expenses (including
              attorney’s fees, expert fees and out-of-pocket expenses) in connection with (i) Subscriber’s use of the Cloud Services, (ii)
              Subscriber’s violation of the terms of this Agreement, (iii) Subscriber’s violation of any third party rights, including any
              intellectual property rights, (iv) Subscriber’s misuse or fraudulent use of credit and debit cards, (v) any claims that the Cloud
              Services or any party thereof were exported or otherwise shipped or transported by Subscriber in violation of applicable
              laws, rules and regulations, or (vi) any claim of misuse of the Cloud Services, including, but not limited to, any claim that
              Subscriber is storing illegal files or data in Subscriber’s Account.
              <br/>
              <br/>
              18. EFFECT OF TERMINATION: Without prejudice to any other rights, {brandingName.title} may suspend or terminate, in part or in
              whole, without notice, Subscriber’s use of the Cloud Services and this Agreement if Subscriber does not abide by its terms,
              or in {brandingName.title}’s sole discretion in which case Subscriber must cease all use of the Cloud Services. Sections 9, 10, 11, 12,
              13, 15, 16, 17, 19, 20, 21, and 22 shall survive any termination of this Agreement.
              <br/>
              <br/>
              19. ENTIRE AGREEMENT: This Agreement (as may be amended from time to time) is the entire agreement between
              Subscriber and {brandingName.title} relating to the Cloud Services and they supersede all prior or contemporaneous oral or written
              communications, proposals and representations with respect to the Cloud Services. To the extent the terms of any
              {brandingName.title} Terms of Use, policies or programs conflict with the terms of this Agreement, the terms of this Agreement
              shall prevail and control. In addition, the terms set out in this Agreement shall prevail and control over any and all additional
              or conflicting terms or provisions contained in any document of Subscriber’s, whether set out in a purchase order or
              alternative license, and any and all such additional or conflicting terms shall be void ab initio and shall have no effect.
              <br/>
              <br/>
              20. GOVERNING LAW: This Agreement shall be governed by and construed in accordance with the laws of the State of North
              Carolina. If any provision of this Agreement is held by a court of competent jurisdiction to be illegal, invalid or unenforceable
              then the provision shall be severed, and the other provisions shall remain in full force and effect. Venue for any cause of
              action arising under or in connection with this Agreement shall be Rutherford County, North Carolina, for state law matters
              and the Western District of North Carolina, for federal law matters.
              <br/>
              <br/>
              21. TAXES: Any sales, use, value added or other taxes (including applicable withholding taxes), shall be borne by the
              Subscriber. Accordingly, Subscriber shall pay or, if paid by {brandingName.title}, shall reimburse {brandingName.title} for all such taxes
              based on this License or any fees payable hereunder (but not any taxes based upon {brandingName.title}’s revenues or income),
              together with any interest and penalties on such taxes if not due to {brandingName.title}’s delay.
              <br/>
              <br/>
              22. EQUITABLE RELIEF: The parties hereto agree that irreparable damage would occur if any provision of this Agreement
              were not performed in accordance with the terms hereof and that the parties shall be entitled to equitable relief, including
              injunctive relief or specific performance of the terms hereof (without any requirement to post bond or guarantee), in
              addition to any other remedy to which they are entitled at law or in equity.
              <br/>
              <br/>
              23. MISCELLANEOUS: The delay or failure of {brandingName.title} to exercise any right provided in this Agreement shall not be
              deemed a waiver of that right. This Agreement may not be amended by Subscriber, but {brandingName.title} may amend this
              Agreement from time to time and shall post any amended Agreement on its website at {brandingName.url}. This
              Agreement constitutes the entire understanding between the parties with respect to the subject matter of this Agreement
              and supersedes all written and oral prior agreements, negotiations and discussions between the parties relating to it. This
              Agreement is for the sole benefit of {brandingName.title} and Subscriber and nothing herein, express or implied, is intended to or
              shall confer upon any other person or entity any legal or equitable right, benefit or remedy of any nature whatsoever under
              or by reason of this Agreement. If any provision of this Agreement shall be held to be illegal, void or unenforceable by any
              court of competent jurisdiction or by arbitral tribunal, such provision shall be of no force and effect and shall not impair the 
              enforceability of any other provision of this Agreement and the parties agree that the relevant provision shall be deemed
              replaced by such provision which is binding and enforceable and which differs as little as possible from the non-binding
              and/or non-enforceable provision, taking into effect the object and purpose of this Agreement. The remedies of the parties
              under this Agreement are cumulative and will not exclude any other remedies to which the respective party may be lawfully
              entitled. All notices must be in writing and shall be mailed by registered or certified mail (effective on the third day following
              the date of mailing), or sent via email to {brandingName.email.support} (with evidence of effective transmission). All notices
              must be addressed to Customer Service Dept., {brandingName.title}, Inc., P.O. Box 667, Rutherfordton, NC 28139. Subscriber may
              not assign, pledge or otherwise transfer this Agreement, or any rights or obligations hereunder in whole or in part to any
              other entity. Paragraph headings are for convenience and shall have no effect on interpretation. Third party software shall
              be exclusively subject to the terms and conditions between the third party software provider and third party software
              Customer. {brandingName.title} shall have no liability for third party software. 
            </div>
          </div>
        </div>
      </div>
    )
  }
}

PDFTermsServices.propTypes = {
  autoScroll: PropTypes.bool
  , controls: PropTypes.bool
  , dispatch: PropTypes.func
  , filePath: PropTypes.string.isRequired
  , pdfClasses: PropTypes.string
  , hidden: PropTypes.bool
  , scale: PropTypes.number
}

PDFTermsServices.defaultProps = {
  autoScroll: false
  , controls: true
  , file: ''
  , styles: ''
  , hidden: false
  , scale: 2
}

export default connect()(PDFTermsServices);
