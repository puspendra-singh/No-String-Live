/**
 *   Function for Submit form on Enter (Pass Submit Button class in Form data-form-submit-class attribute)
 */
$(document).on("keyup", ".on_click_submit", function (e) {
  var key = e.which;
  if (key == 13) {
    var className = e.target.className;
    if (className.indexOf("notSubmitOnEnter") < 0) {
      if (
        e.shiftKey == 0 ||
        (e.shiftKey == 1 && $(e.target)[0].type != "textarea")
      ) {
        var submitId = $(this).attr("data-submit-btn-id");
        $("#" + submitId).trigger("click");
        return false;
      }
    }
  }
});

/**
 * Function startTextLoading
 * @ param btnId
 **/

function startTextLoading(btnId) {
  $("#loaderShell").addClass("loaderShell");
  $("#loader").addClass("loader");
  $("#" + btnId)
    .children()
    .addClass("fa-spinner fa-spin");
}

/**
 * Function stopTextLoading
 * @param btnId
 **/

function stopTextLoading(btnId) {
  $("#loaderShell").removeClass("loaderShell");
  $("#loader").removeClass("loader");
  $("#" + btnId)
    .children()
    .removeClass("fa-spinner fa-spin");
}

/**
 * Function ajax submit
 **/
function ajax_submit(formId, callback) {
  var options = {
    success: function (response) {
      if (response.status == "success") {
        callback(true, response);
      } else if(response.status == "error") {
        callback(true, response);
      }else{
        displayErrors(response.message, formId);
        callback(false, response);
      }
    },
    resetForm: false,
  };
  $("#" + formId).ajaxSubmit(options);
}

/**
 * Function ajax submit only for user login
 **/
function ajax_submit_login(formId, callback) {
  var currentUrl =
    window.location && window.location.href ? window.location.href : "";
  var options = {
    url: "" + currentUrl + "",
    type: "POST",
    success: function (response) {
      if (response.status == "success") {
        callback(true, response);
      } else {
        displayErrors(response.message, formId);
        callback(false, response);
      }
    },
    resetForm: false,
  };
  $("#" + formId).ajaxSubmit(options);
}

/**
 * Function to display errors
 **/
function displayErrors(errors, formId) {
  $firstError = "";
  $("#" + formId)
    .find("span.error")
    .html("");
  $("#" + formId)
    .find("form-group")
    .removeClass("error");
  $.each(errors, function (index, html) {
    if (html.param == "invalid-access") {
      if (($firstError = "")) {
        $firstError = "user-defined-notice";
      }
      //notice('error'.html.msg);
    } else {
      var errorId = html.param;
      if ($firstError == "") {
        $firstError = errorId;
      }
      $("#" + formId + " #" + errorId + "_error")
        .prev(".form-group")
        .addClass("error");
      $("#" + formId + " #" + errorId + "_error")
        .html(html.msg)
        .show();
    }

  });
  if ($firstError != "") {
    var scrollTopId = "#" + $firstError;
    if ($firstError != "user-defined-notice") {
      $("#" + $firstError + "_error").focus();
      scrollTopId = "#" + formId + "#" + $firstError + "_error";
    }
    if ($(scrollTopId).length > 0) {
      $("html,body").animate(
        { scrollTop: $(scrollTopId).offset().top - 150 },
        "slow"
      );
    }
  }
}

/**
 *	Function for custom ajax submit for multipart form data with multilevel array
 *
 * 	@param var formId as form id for submitting form
 * 	@param var callback for callback function
 *
 *	@return null
 */
function submit_multipart_form(formId, callback) {
  /** take all form input values in Object format */
  var formData = $("#" + formId).serializeObject();
  /** FormData is used to submit multipart/form-data */
  var fd = new FormData();
  if (formData != undefined) {
    $.each(formData, function (key, value) {
      /** Append all input values into FormData object */
      if (typeof value == "object") {
        fd.append(key, JSON.stringify(value));
      } else {
        fd.append(key, value);
      }
    });
  }

  /** Form data is used to submit multipart/form-data */
  var fileData = $('input[type="file"]');
  if (fileData != undefined) {
    $.each(fileData, function (key, value) {
      if (value.files[0] != undefined) {
        var name = value.name ? value.name : "";
        if (value.multiple != undefined && value.multiple != false) {
          var filesValue = value.files ? value.files : "";
          $.each(filesValue, function (keyFile, valueFile) {
            fd.append(name + "[" + keyFile + "]", valueFile);
          });
        } else {
          var filesValue = value.files[0] ? value.files[0] : "";
          fd.append(name, filesValue);
        }

        /** Append all file input values into FormData object */
      }
    });
  }
  var currentUrl =
    window.location && window.location.href ? window.location.href : "";

  var options = {
    url: currentUrl,
    type: "POST",
    data: fd,
    processData: false,
    contentType: false,
    success: function (response) {
      if (response.status == "success") {
        callback(true, response);
      } else {
        displayErrors(response.message, formId);
        callback(false, response);
      }
    },
  };
  $.ajax(options);
} //end submit_multipart_form()

/** function for confirmation message **/
$(document).on("click", ".confirm_box", function (e) {
  e.stopImmediatePropagation();
  url = $(this).attr("data-href");
  confirmMessage = $(this).attr("data-confirm-message");
  confirmHeading = $(this).attr("data-confirm-heading");
  confirmBox("warning", confirmHeading, confirmMessage, function (result) {
    window.location.replace(url);
  });
  e.preventDefault();
});

/**
 * @param type is used for message type
 * @param heading is used for message heading
 * @param message is used for message
 * @param return callback
 */

var timer;
function confirmBox(type, heading, message, callback) {
  clearTimeout(timer);
  swal(
    {
      title: heading,
      text: message,
      type: type,
      showCancelButton: true,
      cancelButtonColor: "#f60e0e",
      confirmButtonText: "Ok",
      closeOnConfirm: false,
      confirmButtonColor: "#00bf4f",
      showLoaderOnConfirm: true,
    },
    function () {
      callback();
    }
  );
}

/** function for confirmation with message **/
$(document).on("click", ".confirm_box_message", function (e) {
  e.stopImmediatePropagation();
  url = $(this).attr("data-href");
  confirmMessage = $(this).attr("data-confirm-message");
  confirmHeading = $(this).attr("data-confirm-heading");
  confirmBoxMessage(
    "warning",
    confirmHeading,
    confirmMessage,
    url,
    function (result) {
      //window.location.replace(url);
    }
  );
  e.preventDefault();
});

/**
 * @param type is used for message type
 * @param heading is used for message heading
 * @param message is used for message
 * @param return callback
 */

var timer;
function confirmBoxMessage(type, heading, message, url, callback) {
  clearTimeout(timer);
  swal(
    {
      title: heading,
      text: message,
      type: "input",
      showCancelButton: true,
      cancelButtonColor: "#f60e0e",
      confirmButtonText: "Submit",
      closeOnConfirm: false,
      confirmButtonColor: "#00bf4f",
      showLoaderOnConfirm: true,
      inputPlaceholder: "Write something here",
    },
    function (isConfirm) {
      if (isConfirm === false) return false;
      isConfirm = isConfirm.toString().trim();
      if (isConfirm === "") {
        swal.showInputError("You need to write something here!");
        return false;
      } else {
        $.ajax({
          url: url,
          type: "POST",
          data: {
            reason: isConfirm,
          },
          success: function (response) {
            window.location.href = response.rediect_url;
          },
          error: function (xhr, ajaxOptions, thrownError) {
            window.location.href = response.rediect_url;
          },
        });
      }
    }
  );
}

/** Function for confirmation popup**/
!(function (t) {
  "use strict";
  var e = {};
  t(document).ready(function () {
    return (
      t(".delete-warning").length && e.warning(),
      t(".status-warning").length && e.warning(),
      t("#welcome-messgae").length && e.auto(),
      !1
    );
  }),
    (e = {
      warning: function () {
        return (
          t(".delete-warning").on("click", function () {
            var id = $(".delete-warning").attr("id");
            return (
              swal(
                {
                  title: "Are you sure?",
                  text: "You want to delete this " + id + " !",
                  type: "warning",
                  showCancelButton: !0,
                  confirmButtonColor: "#ffffff",
                  confirmButtonText: "Yes, delete it!",
                  cancelButtonText: "No, cancel plx!",
                  closeOnConfirm: !1,
                  closeOnCancel: !1,
                  confirmButtonColor: "#f60e0e",
                },
                function (t) {
                  t
                    ? swal({
                        title: "Deleted!",
                        text: id + " has been deleted.",
                        type: "success",
                        confirmButtonColor: "#304ffe",
                      })
                    : swal({
                        title: "Cancelled",
                        text: id + " is safe",
                        type: "error",
                        confirmButtonColor: "#f60e0e",
                      });
                }
              ),
              !1
            );
          }),
          t(".status-warning").on("click", function () {
            return (
              swal(
                {
                  title: "Are you sure?",
                  text: "You want to change status of this ",
                  type: "warning",
                  showCancelButton: !0,
                  confirmButtonColor: "#DD6B55",
                  confirmButtonText: "Yes, change it!",
                  cancelButtonText: "No, cancel plx!",
                  closeOnConfirm: !1,
                  closeOnCancel: !1,
                  confirmButtonColor: "#f60e0e",
                },
                function (t) {
                  t
                    ? swal({
                        title: "Changed!",
                        text: "Status has been changed.",
                        type: "success",
                        confirmButtonColor: "#304ffe",
                      })
                    : swal({
                        title: "Cancelled",
                        text: "Your imaginary file is safe",
                        type: "error",
                        confirmButtonColor: "#f60e0e",
                      });
                }
              ),
              !1
            );
          }),
          !1
        );
      },
      auto: function () {
        return (
          t("#welcome-messgae").on("click", function () {
            return (
              swal({
                title: "Welcome!",
                text: "th",
                timer: 2e3,
                showConfirmButton: !1,
              }),
              !1
            );
          }),
          !1
        );
      },
    });
})(jQuery);

function setDateTimeFormat() {
  var dateTimeFormat = $(".setDateTimeFormat").attr("data-time-format")
    ? $(".setDateTimeFormat").attr("data-time-format")
    : DEFAULT_DATE_TIME_FORMAT;
  var dateTime = $(".setDateTimeFormat").attr("data-time")
    ? $(".setDateTimeFormat").attr("data-time")
    : new Date();
  var newDate = moment(dateTime).format(dateTimeFormat);
  $(".setDateTimeFormat").text(newDate);
}
setDateTimeFormat();

function setDateTimeFormat2() {
  var dateTimeFormat = $(".setDateTimeFormat2").attr("data-time-format")
    ? $(".setDateTimeFormat2").attr("data-time-format")
    : DEFAULT_DATE_TIME_FORMAT;
  var dateTime = $(".setDateTimeFormat2").attr("data-time")
    ? $(".setDateTimeFormat2").attr("data-time")
    : new Date();
  var newDate = moment(dateTime).format(dateTimeFormat);
  $(".setDateTimeFormat2").text(newDate);
}
setDateTimeFormat2();

//getFileExtension();
$(document).ready(function () {
  $(".file_type").each(function () {
    var fileName = $(this).attr("data-file") ? $(this).attr("data-file") : "";
    let extension = fileName ? fileName.split(".") : "";
    if (extension) extension = extension.pop().toLowerCase();
    if (extension == "pdf") {
      $(this).find(".image_view_pdf").removeClass("hide");
    } else {
      $(this).find(".image_view_other").removeClass("hide");
    }
  });
});

/** update ckeditor value */
function updateCkeditorValue() {
  for (instance in CKEDITOR.instances) {
    CKEDITOR.instances[instance].updateElement();
  }
}

/** To Remove flash message after 5 sec**/
$("document").ready(function () {
  setTimeout(function () {
    $("div.alert").remove();
  }, 5000); // 5 secs
});

// File Upload JS Only

$(document).on("change", ".up", function () {
  var names = [];
  var length = $(this).get(0).files.length;
  for (var i = 0; i < $(this).get(0).files.length; ++i) {
    names.push($(this).get(0).files[i].name);
  }
  // $("input[name=file]").val(names);
  if (length > 2) {
    var fileName = names.join(", ");
    $(this)
      .closest(".form-group")
      .find(".form-control")
      .attr("value", length + " files selected");
  } else {
    $(this).closest(".form-group").find(".form-control").attr("value", names);
  }
});

/**Get States list*/
function getStatesList(countryId) {
  $.ajax({
    url: WEBSITE_ADMIN_URL + "users/get_states",
    type: "POST",
    data: { country_id: countryId },
    success: function (response) {
      /**States list*/
      var stateList = response.state_list ? response.state_list : "";
      // $("select.state").html("");

      $("select.state").html(response);
    },
  });
} //End getstatesList()

function getCitiesList(countryId, stateId) {
  $.ajax({
    url: WEBSITE_ADMIN_URL + "users/get_cities",
    type: "POST",
    data: { country_id: countryId , state_id: stateId},
    success: function (response) {
      /**Cities list*/
      var citiesList = response.city_list ? response.city_list : "";
      // $("select.city").html("");
      $("select.city").html(response);
      // $("select.city").html.select2(citiesList);
    },
  });
} //End getCitiesList()

/**Get Billing States list*/
function getBillingCountriesList(cb) {
  $.ajax({
    url: WEBSITE_ADMIN_URL + "users/get_billing_countries",
    type: "POST",
    data: {},
    success: function (response) {
      /**States list*/
      // var stateList = response.state_list ? response.state_list : "";
      // $("select.state").html("");

      $("select.billing_country").html(response);
      if(typeof cb === 'function'){
        cb();
      }
    },
  });
} //End getstatesList()

/**Get Billing States list*/
function getBillingStatesList(countryId, cb) {
  $.ajax({
    url: WEBSITE_ADMIN_URL + "users/get_billing_states",
    type: "POST",
    data: { country_id: countryId },
    success: function (response) {
      /**States list*/
      var stateList = response.state_list ? response.state_list : "";
      // $("select.state").html("");

      $("select.billing_state").html(response);
      if(typeof cb === 'function'){
        cb();
      }
    },
  });
} //End getstatesList()

function getBillingCitiesList(countryId, stateId, cb) {
  $.ajax({
    url: WEBSITE_ADMIN_URL + "users/get_billing_cities",
    type: "POST",
    data: { country_id: countryId , state_id: stateId},
    success: function (response) {
      /**Cities list*/
      var citiesList = response.city_list ? response.city_list : "";
      // $("select.city").html("");

      $("select.billing_city").html(response);
      // $("select.city").html.select2(citiesList);
      if(typeof cb === 'function'){
        cb();
      }
      
    },
  });
} //End getCitiesList()

// File Upload JS Only
/**Get States list*/
function getMastersStatesList(countryId) {
  $.ajax({
    url: WEBSITE_ADMIN_URL + "masters/city/get_states",
    type: "POST",
    data: { country_id: countryId },
    success: function (response) {
      /**States list*/
      var stateList = response.state_list ? response.state_list : "";
      // $("select.state").html("");
      $("#state").html(response);
    },
  });
} //End getstatesList()

/**Get Billing States list*/
function getCompanyStatesList(countryId, cb) {
  $.ajax({
    url: WEBSITE_ADMIN_URL + "users/get_states",
    type: "POST",
    data: { country_id: countryId },
    success: function (response) {
      /**States list*/
      var stateList = response.state_list ? response.state_list : "";
      // $("select.state").html("");

      $("select.company_state").html(response);
      if(typeof cb === 'function'){
        cb();
      }
    },
  });
} //End getstatesList()

function getCompanyCitiesList(countryId, stateId, cb) {
  $.ajax({
    url: WEBSITE_ADMIN_URL + "users/get_cities",
    type: "POST",
    data: { country_id: countryId , state_id: stateId},
    success: function (response) {
      /**Cities list*/
      var citiesList = response.city_list ? response.city_list : "";
      // $("select.city").html("");

      $("select.company_city").html(response);
      // $("select.city").html.select2(citiesList);
      if(typeof cb === 'function'){
        cb();
      }
      
    },
  });
} //End getCitiesList()

// input minimum value validation
function minValidation(input,minVal){
  if(String(input.value).length > 0 && Number(input.value) < minVal){
    input.value = minVal;
  }
}

// input minimum and maximum value validation
function minMaxValidation(input,minVal,maxVal){
  if(String(input.value).length > 0 ){
    if(Number(input.value) < minVal){
      input.value = minVal;
    }else if(Number(input.value) > maxVal){
      input.value = maxVal;
    }
  }
}

