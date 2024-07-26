import axios from "axios";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import fs from "fs";
const createAccessToken = asyncHandler(async (req, res) => {
  try {
    const {
      // General field
      name,
      email,
      phone,
      city,
      state,
      zip,

      // Products field
      quantity,
      notes,
      imprintText,
      color,
      product_title,
      size,
      badgeHolderType,
      badgeReelType,
      badgeReelCurrency,
      badgeHolderCurrency,
      customBadgeHolderCurrency,
      product_flag,

      // Landyard attachments
      bullDogClipQuantity,
      keyRingQuantity,
      thumbTriggerQuantity,
      swivelJHooksQuantity,
      cellPhoneLoopsQuantity,
      carabinarHooksQuantity,
      plasticJHooksQuantity,
      ovalHooksQuantity,
      discounnectBucklesQuantity,
      safetyBreakAwayQuantity,
      lengthAdjusterQuantity,
      thumbHooksQuantity,
      noSwivelJHooksQuantity,
      plasticClampQuantity,

      customBadgeHolder,
    } = req.body;

    const body = req.body;
    if (!body) throw new ApiError(404, "Data not found");
    const url = "https://login.salesforce.com/services/oauth2/token";

    const data = {
      username: "support@cartmade.com",
      password: "Cartmade2019#DdRjVkrT5yQOniNyOJq4xyWM",
      grant_type: "password",
      client_id:
        "3MVG9mclR62wycM1Eli6OTTyBzrk4G_20zKJAqMoHzImlSsuMmuslzIb9_WROc17x7TWUHWXSOJw0bz97CU1m",
      client_secret:
        "451B4A40ECE20B40CA245DDD2F6D14687121EBF7C24107C88E5376ABB798E839",
    };

    const config = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie:
          "BrowserId=w0z4pTqeEe-LtSXqHASufQ; CookieConsentPolicy=0:0; LSKey-c$CookieConsentPolicy=0:0",
      },
      maxBodyLength: Infinity,
    };
    const { data: response } = await axios.post(
      url,
      new URLSearchParams(data),
      config
    );

    if (!response) throw new ApiError(400, "Error occured");

    const accessToken = response?.access_token;
    const instance_url = response?.instance_url;
    if (!accessToken) {
      throw new ApiError(400, "Failed to generate access token");
    }

    const _headers = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const accountUrl = `${instance_url}/services/data/v58.0/sobjects/Account`;

    const accountData = {
      Name: name,
      Email_Address__c: email,
    };

    // // creates the account id
    const { data: accountObj } = await axios.post(
      accountUrl,
      accountData,
      _headers
    );

    const accountId = accountObj?.id;

    if (!accountId) throw new ApiError(400, "Failed to create a account id");

    const opportunityUrl = `${instance_url}/services/data/v58.0/sobjects/Opportunity`;

    const opportunityData = {
      AccountId: accountId,
      Billing_First_Name__c: name,
      Contact_Email_Address__c: email,
      Source_Website_PL__c: "TEST JOB",
      Phone_Number__c: phone,
      Shipping_City__c: city,
      Shipping_State__c: state,
      Shipping_Zip_Postal_Code__c: zip,
    };

    const { data: opportunityObj } = await axios.post(
      opportunityUrl,
      opportunityData,
      _headers
    );

    const opportunityId = opportunityObj?.id;

    if (!opportunityId)
      throw new ApiError(400, "Failed to create opportunity id");

    let imageLinkId;

    if (req.file !== undefined) {
      const imageUploadUrl = `${instance_url}/services/data/v51.0/sobjects/ContentVersion`;
      const filePath = req.file?.path;
      const fileOriginalName = req.file?.originalname;
      const fileData = fs.readFileSync(filePath);
      const base64FileData = Buffer.from(fileData).toString("base64");

      const contentVersion = {
        Title: fileOriginalName,
        PathOnClient: fileOriginalName,
        VersionData: base64FileData,
      };

      const imageData = await fetch(imageUploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(contentVersion),
      });

      const imageResponse = await imageData.json();

      const contentVersionId = imageResponse?.id;

      const contentVersionRecord = await fetch(
        `${instance_url}/services/data/v51.0/sobjects/ContentVersion/${contentVersionId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      ).then((res) => res.json());

      const contentDocumentId = contentVersionRecord.ContentDocumentId;

      const contentDocumentLink = {
        ContentDocumentId: contentDocumentId,
        LinkedEntityId: opportunityId,
        ShareType: "V",
        Visibility: "AllUsers",
      };

      const linkResponse = await fetch(
        `${instance_url}/services/data/v51.0/sobjects/ContentDocumentLink`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(contentDocumentLink),
        }
      ).then((res) => res.json());

      imageLinkId = linkResponse?.id;
    }

    let incomingData;

    if (product_flag === "lanyardField") {
      incomingData = {
        // Custom_Field_Image__c: imageLinkId,
        Opportunity__c: opportunityId,
        RecordTypeId: "0121N000001hNZ7QAM",
        Type__c: product_title,
        Size__c: size,
        Quantity__c: quantity < 100 ? 100 : quantity,
        Strap_Colors__c: color,
        Color__c: color,
        Customer_Received_notess__c: notes,
        Imprint_Text__c: imprintText,

        // quantitys
        Bulldog_Clips__c: bullDogClipQuantity ? quantity : 0,
        Key_Rings__c: keyRingQuantity ? quantity : 0,
        Thumb_Triggers__c: thumbTriggerQuantity ? quantity : 0,
        Swivel_J_Hooks__c: swivelJHooksQuantity ? quantity : 0,
        Cell_Phone_Loops__c: cellPhoneLoopsQuantity ? quantity : 0,
        Carabiner_Hooks__c: carabinarHooksQuantity ? quantity : 0,
        Plastic_J_Hooks__c: plasticJHooksQuantity ? quantity : 0,
        Oval_Hooks__c: ovalHooksQuantity ? quantity : 0,
        Disconnect_Buckles__c: discounnectBucklesQuantity ? quantity : 0,
        Safety_Breakaways__c: safetyBreakAwayQuantity ? quantity : 0,
        Length_Adjusters__c: lengthAdjusterQuantity ? quantity : 0,
        Thumb_Hooks__c: thumbHooksQuantity ? quantity : 0,
        No_Swivel_J_Hooks__c: noSwivelJHooksQuantity ? quantity : 0,
        Plastic_Clamp__c: plasticClampQuantity ? quantity : 0,

        Badge_Holder__c: badgeHolderType,
        Badge_Holder_Costs__c: badgeHolderCurrency,
        Custom_Badge_Holder_Costs__c: customBadgeHolderCurrency,

        Badge_Reel_Type__c: badgeReelType,
        Badge_Reel_Costs__c: badgeReelCurrency,
      };
    } else if (product_flag === "badgeReelField") {
      incomingData = {
        Opportunity__c: opportunityId,
        RecordTypeId: "0123m000001g0YHAAY",
        Quantity__c: quantity < 100 ? 100 : quantity,
        Customer_Received_notess__c: notes,
        Badge_Reel_Type__c: size,
        // Imprint_Text__c: imprintText,
      };
    } else if (product_flag === "badgeHolder") {
      incomingData = {
        Opportunity__c: opportunityId,
        RecordTypeId: "012R3000000rMiLIAU",
        Quantity__c: quantity < 100 ? 100 : quantity,
        type__c: size,
        Customer_Received_notess__c: notes,
        Custom_Option_s__c: size === "Custom" ? customBadgeHolder : null,
      };
    } else if (product_flag === "tagIdField") {
      incomingData = {
        Opportunity__c: opportunityId,
        Quantity__c: quantity < 150 ? 150 : quantity,
        RecordTypeId: "012R3000000p8TNIAY",
        Size__c: size,
        Item_Color__c: color,
        Imprint_Text__c: imprintText || "Imprint text",
        Customer_Received_notess__c: notes,
        // Badge_Holder__c: badgeHolderType,
        Add_Dome_To_Label__c: false,
      };
    }

    const opportunityLineItemUrl = `${instance_url}/services/data/v58.0/sobjects/Opportunity_Product__c`;

    const _response = await fetch(opportunityLineItemUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`, // Assuming `_headers` contains the `Authorization` header
      },
      body: JSON.stringify(incomingData),
    });

    if (!_response.ok) {
      const errorData = await _response.json();
      throw new Error(
        `Error: ${_response.status} - ${
          _response.statusText
        }. Details: ${JSON.stringify(errorData)}`
      );
    }

    const _responseData = await _response.json();

    return res
      .status(200)
      .json(new ApiResponse(200, _responseData, "Opportunity data"));
  } catch (error) {
    console.log("Erro start");
    console.log(JSON.stringify(error));
    throw new ApiError(
      400,
      error.response?.data[0].message ||
        error.response?.data.error ||
        error ||
        "Try again in few minutes"
    );
  }
});

export { createAccessToken };
