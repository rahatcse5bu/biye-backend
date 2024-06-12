import mongoose, { model, Model, Schema } from "mongoose";
import { IEducationalQualification } from "./educational_qualification.interface";

// Create a Schema corresponding to the document interface.
const EducationalQualificationSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    education_medium: { type: String, required: false },
    highest_edu_level: { type: String, required: false },
    others_edu: { type: String, required: false },
    // Secondary School Certificate (SSC) Information
    before_ssc: { type: String, required: false },
    deeni_edu: [],
    ssc_year: { type: Number, required: false },
    ssc_group: { type: String, required: false },
    ssc_result: { type: String, required: false },

    // After SSC Information
    after_ssc_running: { type: Boolean, required: false },
    after_ssc_result: { type: String, required: false },
    after_ssc_group: { type: String, required: false },
    after_ssc_year: { type: Number, required: false },

    // Diploma Information
    diploma_running_year: { type: Number, required: false },
    diploma_sub: { type: String, required: false },
    diploma_inst: { type: String, required: false },
    diploma_pass_year: { type: Number, required: false },

    // Honors Information
    hons_inst: { type: String, required: false },
    hons_year: { type: Number, required: false },
    hons_sub: { type: String, required: false },
    after_ssc_medium: { type: String, required: false },
    hons_pass_year: { type: Number, required: false },

    // Masters (MSc) Information
    msc_sub: { type: String, required: false },
    msc_pass_year: { type: Number, required: false },
    msc_inst: { type: String, required: false },

    // PhD Information
    phd_pass_year: { type: Number, required: false },
    phd_inst: { type: String, required: false },
    phd_sub: { type: String, required: false },

    // Additional Qualifications
    ibti_result: { type: String, required: false },
    ibti_pass_year: { type: Number, required: false },
    ibti_inst: { type: String, required: false },

    mutawas_inst: { type: String, required: false },
    mutawas_pass_year: { type: Number, required: false },
    mutawas_result: { type: String, required: false },

    sanabiya_inst: { type: String, required: false },
    sanabiya_result: { type: String, required: false },
    sanabiya_pass_year: { type: Number, required: false },

    fozilat_inst: { type: String, required: false },
    fozilat_result: { type: String, required: false },
    fozilat_pass_year: { type: Number, required: false },

    takmil_inst: { type: String, required: false },
    takmil_result: { type: String, required: false },
    takmil_pass_year: { type: Number, required: false },

    takhassus_inst: { type: String, required: false },
    takhassus_result: { type: String, required: false },
    takhassus_sub: { type: String, required: false },
    takhassus_pass_year: { type: Number, required: false },

    status: { type: String, required: false },
  },
  { timestamps: true }
);

// Create a Model.
const EducationalQualification: Model<IEducationalQualification> =
  model<IEducationalQualification>(
    "EducationalQualification",
    EducationalQualificationSchema
  );

export default EducationalQualification;
