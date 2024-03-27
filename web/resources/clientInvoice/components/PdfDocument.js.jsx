import React from "react";
import {
  Page,
  Text,
  Document,
  StyleSheet,
  Image,
  View,
} from "@react-pdf/renderer";
import NumberFormat from "react-number-format";
import brandingName from "../../../global/enum/brandingName.js.jsx";

// Create styles
const styles = StyleSheet.create({
  body: {
    padding: 10,
  },
  content: {
    padding: 10,
    "@media max-width: 400": {
      flexDirection: "column",
    },
    "@media min-width: 400": {
      flexDirection: "row",
    },
  },
  h50w500: {
    height: 50,
    width: 500,
  },
  secondBlock: {
    height: 100,
    width: 500,
  },
  thirdBlock: {
    height: 20,
    width: 500,
  },
  fourthBlock: {
    height: 20,
    width: 500,
    position: "relative",
    top: -15,
  },
  fifthBlock: {
    height: 200,
    width: 500,
    position: "relative",
    top: -35,
  },
  l60Text: {
    fontSize: 15,
    textAlign: "justify",
    fontFamily: "Times-Roman",
    marginBottom: 5,
    position: "relative",
    left: 60,
    top: -5
  },
  fs12Text: {
    fontSize: 12,
    textAlign: "justify",
    fontFamily: "Times-Roman",
    marginBottom: 5,
  },
  fs15Text: {
    fontSize: 15,
    textAlign: "justify",
    fontFamily: "Times-Roman",
  },
  fs12m8Text: {
    fontSize: 12,
    textAlign: "justify",
    fontFamily: "Times-Roman",
    marginBottom: 8,
  },
  fs10m8Text: {
    fontSize: 10,
    textAlign: "justify",
    fontFamily: "Times-Roman",
    marginBottom: 8,
  },
  fs12m5l50Text: {
    fontSize: 12,
    textAlign: "justify",
    fontFamily: "Times-Roman",
    marginTop: 2,
    position: "relative",
    left: 50,
  },
  fs12mb5l150Text: {
    fontSize: 12,
    textAlign: "justify",
    fontFamily: "Times-Roman",
    position: "relative",
    marginBottom: 5,
    left: 150,
  },
  fs12mt12l150Text: {
    fontSize: 12,
    textAlign: "justify",
    fontFamily: "Times-Roman",
    position: "relative",
    marginTop: -12,
    left: 150,
  },
  fs12mt5l50Text: {
    fontSize: 12,
    textAlign: "justify",
    fontFamily: "Times-Roman",
    marginTop: 5,
    position: "relative",
    left: 50,
  },
  textUnderline: {
    textDecoration: "underline",
    fontSize: 12,
    textAlign: "justify",
    fontFamily: "Times-Roman",
  },
  l150TextUnderline: {
    textDecoration: "underline",
    fontSize: 12,
    textAlign: "justify",
    fontFamily: "Times-Roman",
    position: "relative",
    left: 150,
  },
  image: {
    width: 200,
    height: 35,
    position: "relative",
    top: 15,
    left: 20
  },
  horizontalLine: {
    borderBottom: "2px solid #F5684D",
    marginBottom: 10,
  },
  horizontalLine2: {
    borderBottom: "1px solid black",
    width: 40,
    position: "relative",
    left: 150,
  },
});

let firmLogo = brandingName.image.logoBlack;
const FirstRow = ({ firmName, firmAddress }) => (
  <View style={styles.content}>
    <View style={styles.h50w500}>
      <Text style={styles.fs12m8Text}>{firmName}</Text>
      {firmAddress && (
        <View style={styles.wrapper}>
          <Text style={styles.fs10m8Text}>{`${
            firmAddress ? firmAddress.street1 : ""
          }`}</Text>

          <Text style={styles.fs10m8Text}>
            {firmAddress ? firmAddress.street2 : ""}
          </Text>
          <Text style={styles.fs10m8Text}>{`${
            firmAddress ? firmAddress.city : ""
          }, ${firmAddress ? firmAddress.country : ""} ${
            firmAddress ? firmAddress.postal : ""
          }`}</Text>
        </View>
      )}
    </View>
    <View style={styles.h50w500}>
      <Image src={firmLogo} style={styles.image} />
    </View>
  </View>
);

const SecondRow = ({
  clientName,
  clientAddress,
  invoiceDate,
  dueDate,
  invoiceNum,
  invoiceAmt,
  invoiceBal,
}) => (
  <View style={styles.content}>
    <View style={styles.secondBlock}>
      <Text style={styles.fs12m8Text}>{clientName}</Text>
      {clientAddress && (
        <View>
          <Text style={styles.fs10m8Text}>{`${
            clientAddress ? clientAddress.street1 : ""
          }`}</Text>
          <Text style={styles.fs10m8Text}>
            {clientAddress ? clientAddress.street2 : ""}
          </Text>
          <Text style={styles.fs10m8Text}>{`${
            clientAddress ? clientAddress.city : ""
          }, ${clientAddress ? clientAddress.country : ""} ${
            clientAddress ? clientAddress.postal : ""
          }`}</Text>
        </View>
      )}
    </View>
    <View style={styles.secondBlock}>
      <Text style={styles.l60Text}>INVOICE SUMMARY</Text>
      <Text style={styles.fs12m5l50Text}>Invoice Date:</Text>
      <Text style={styles.fs12mt12l150Text}>{invoiceDate}</Text>
      <Text style={styles.fs12m5l50Text}>Due Date:</Text>
      <Text style={styles.fs12mt12l150Text}>{dueDate}</Text>
      <Text style={styles.fs12m5l50Text}>Invoice Number:</Text>
      <Text style={styles.fs12mt12l150Text}>{invoiceNum}</Text>
      <Text style={styles.fs12m5l50Text}>Invoice Amount:</Text>
      <Text style={styles.fs12mt12l150Text}>
        <NumberFormat
          thousandsGroupStyle="thousand"
          value={invoiceAmt}
          prefix="$"
          decimalSeparator="."
          displayType="text"
          type="text"
          thousandSeparator={true}
          allowNegative={true}
          decimalScale={2}
          fixedDecimalScale={true}
          allowEmptyFormatting={true}
          allowLeadingZeros={true}
        />
      </Text>
      <Text style={styles.fs12m5l50Text}>Invoice Balance:</Text>
      <Text style={styles.fs12mt12l150Text}>
        <NumberFormat
          thousandsGroupStyle="thousand"
          value={invoiceBal}
          prefix="$"
          decimalSeparator="."
          displayType="text"
          type="text"
          thousandSeparator={true}
          allowNegative={true}
          decimalScale={2}
          fixedDecimalScale={true}
          allowEmptyFormatting={true}
          allowLeadingZeros={true}
        />
      </Text>
    </View>
  </View>
);

const ThirdRow = () => (
  <View style={styles.content}>
    <View style={styles.thirdBlock}>
      <Text style={styles.fs15Text}>Summary of Services</Text>
    </View>
  </View>
);

const FourthRow = () => (
  <View style={styles.content}>
    <View style={styles.fourthBlock}>
      <Text style={styles.textUnderline}>Description</Text>
    </View>
    <View style={styles.fourthBlock}>
      <Text style={styles.l150TextUnderline}>Amount</Text>
    </View>
  </View>
);

const FifthRow = ({ service, invoiceAmt, invoiceBal }) => (
  <View style={styles.content}>
    <View style={styles.fifthBlock}>
      {service &&
        service.map((data) => {
          return (
            <Text style={styles.fs12Text}>{data.invoice_description}</Text>
          );
        })}
    </View>
    <View style={styles.fifthBlock}>
      {service &&
        service.map((data) => {
          return (
            <Text style={styles.fs12mb5l150Text}>
              <NumberFormat
                thousandsGroupStyle="thousand"
                value={data.invoice_amount}
                prefix="$"
                decimalSeparator="."
                displayType="text"
                type="text"
                thousandSeparator={true}
                allowNegative={true}
                decimalScale={2}
                fixedDecimalScale={true}
                allowEmptyFormatting={true}
                allowLeadingZeros={true}
              />
            </Text>
          );
        })}
      <Text style={styles.horizontalLine2} />
      <Text style={styles.fs12mt5l50Text}>Total Services:</Text>
      <Text style={styles.fs12mt12l150Text}>
        <NumberFormat
          thousandsGroupStyle="thousand"
          value={invoiceAmt}
          prefix="$"
          decimalSeparator="."
          displayType="text"
          type="text"
          thousandSeparator={true}
          allowNegative={true}
          decimalScale={2}
          fixedDecimalScale={true}
          allowEmptyFormatting={true}
          allowLeadingZeros={true}
        />
      </Text>
      <Text style={styles.fs12mt5l50Text}>Total Balance:</Text>
      <Text style={styles.fs12mt12l150Text}>
        <NumberFormat
          thousandsGroupStyle="thousand"
          value={invoiceBal}
          prefix="$"
          decimalSeparator="."
          displayType="text"
          type="text"
          thousandSeparator={true}
          allowNegative={true}
          decimalScale={2}
          fixedDecimalScale={true}
          allowEmptyFormatting={true}
          allowLeadingZeros={true}
        />
      </Text>
    </View>
  </View>
);

// Create Document Component
const MyDocument = ({
  firmName,
  clientName,
  invoiceDate,
  invoiceNum,
  invoiceAmt,
  invoiceBal,
  clientAddress,
  firmAddress,
  dueDate,
  service,
}) => (
  <Document>
    <Page size="A4" style={styles.body}>
      <FirstRow firmName={firmName} firmAddress={firmAddress} />
      <Text style={styles.horizontalLine} />
      <SecondRow
        clientName={clientName}
        clientAddress={clientAddress}
        invoiceDate={invoiceDate}
        invoiceNum={invoiceNum}
        invoiceAmt={invoiceAmt}
        invoiceBal={invoiceBal}
        dueDate={dueDate}
      />
      <Text style={styles.horizontalLine} />
      <ThirdRow />
      <FourthRow />
      <FifthRow
        service={service}
        invoiceAmt={invoiceAmt}
        invoiceBal={invoiceBal}
      />
    </Page>
  </Document>
);

export default MyDocument;
