// Suppress react-i18next's global ReactNode type augmentation
// which conflicts with Radix UI Slot components.
// react-i18next is not used in this project -- it's a transitive dependency.
import "react-i18next";

declare module "react-i18next" {
  interface CustomTypeOptions {
    allowObjectInHTMLChildren: false;
  }
}
