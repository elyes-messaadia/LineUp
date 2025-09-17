import { forwardRef } from "react";
import PropTypes from "prop-types";

const ResponsiveContainer = forwardRef(
  (
    {
      children,
      className = "",
      size = "lg",
      spacing = "md",
      padding = true,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "max-w-screen-sm",
      md: "max-w-screen-md",
      lg: "max-w-screen-lg",
      xl: "max-w-screen-xl",
      "2xl": "max-w-screen-2xl",
    };

    const spacingClasses = {
      sm: "space-y-4",
      md: "space-y-6",
      lg: "space-y-8",
    };

    const paddingClasses = padding
      ? `
    px-4
    sm:px-6
    lg:px-8
  `
      : "";

    const baseClasses = `
    ${sizeClasses[size] || sizeClasses.lg}
    mx-auto
    ${spacingClasses[spacing] || spacingClasses.md}
    ${paddingClasses}
  `;

    const combinedClasses = `${baseClasses} ${className}`.trim();

    return (
      <div ref={ref} className={combinedClasses} {...props}>
        {children}
      </div>
    );
  }
);

ResponsiveContainer.displayName = "ResponsiveContainer";

ResponsiveContainer.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg", "xl", "2xl"]),
  spacing: PropTypes.oneOf(["sm", "md", "lg"]),
  padding: PropTypes.bool,
};

export default ResponsiveContainer;
