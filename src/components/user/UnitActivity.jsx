import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { validateImage } from "image-validator";

// My css
import css from "../../css/user/single-unit-page.module.css";

import { SERVER_ORIGIN, vars } from "../../utilities/constants";
import { convertBytesToMegaBytes } from "../../utilities/helper_functions";

const UnitActivity = (props) => {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();
  const params = useParams();

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      toast.error("Please choose an image file");
      return;
    }

    // console.log(file);

    // validate file size
    // console.log(vars.IMAGE_SIZE_LIMIT_IN_BYTES);
    const sizeInBytes = file.size;
    if (sizeInBytes > vars.IMAGE_SIZE_LIMIT_IN_BYTES) {
      document.getElementById(`activity-file-input-${props.index}`).value =
        null;

      setFile(null);

      toast.error(
        `Image size should not exceed ${convertBytesToMegaBytes(
          vars.IMAGE_SIZE_LIMIT_IN_BYTES
        )} MB`
      );

      return;
    }

    setFile(file);
  };

  const handleSubmit = async () => {
    // console.log("Submitting activity...");

    if (!file) {
      toast.error("Please choose an image file");
      return;
    }

    // console.log(file);

    // validate file mime-type
    const mimeType = file.type;
    if (!vars.IMAGE_MIME_TYPES_WHITE_LIST.includes(mimeType)) {
      toast.error("Please choose a JPEG/JPG/PNG image file");
      // todo: add support for jfif etc using MDN docs
      return;
    }

    // validate file content
    try {
      const isImageValid = await validateImage(file, { throw: true });
      // console.log("Image content valid: ", isImageValid); // expected: true, if catch is not hit
    } catch (err) {
      // console.log(err.message);
      toast.error("Please choose a valid image file");
    }

    const form = new FormData();
    form.append("activityIndex", props.index);
    form.append("activityImg", file);
    // console.log(form);

    document.getElementById(`activity-file-input-${props.index}`).value = null;

    setFile(null);

    const { verticalId, courseId, unitId } = params;

    // uploading file
    // ! donot set content-type while using fetch to upload properly
    try {
      const response = await fetch(
        `${SERVER_ORIGIN}/api/user/auth/verticals/${verticalId}/courses/${courseId}/units/${unitId}/activity/submit`,
        {
          method: "POST",
          headers: {
            "auth-token": localStorage.getItem("token"),
          },
          body: form,
        }
      );

      const result = await response.json();
      // console.log(result);

      if (response.status >= 400 && response.status < 600) {
        if (response.status === 401) {
          if ("isLoggedIn" in result && !result.isLoggedIn) {
            navigate("/user/login");
          } else if ("isUser" in result && !result.isUser) {
            navigate("/user/login");
          }
        } else {
          // alert("Internal server error"); // todo: toast notify
          toast.error(result.statusText);
        }
      } else if (response.ok && response.status === 200) {
        toast.success(result.statusText);
      } else {
        // for future
      }
    } catch (err) {
      // console.log(err.message);
    }
  };

  return (
    <div className={css.activityDiv}>
      <p className={css.secText}>
        {props.index + 1}. {props.activity}
      </p>

      <input
        id={`activity-file-input-${props.index}`}
        type="file"
        className={css.activityInput}
        onChange={handleChange}
      />
      <div className={css.activityBtnDiv}>
        <button className={css.secBtn} type="button" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default UnitActivity;

/* 
Reference:
To send multipart form data using fetch api: https://stackoverflow.com/questions/46640024/how-do-i-post-form-data-with-fetch-api
*/
