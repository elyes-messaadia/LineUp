import { forwardRef, useMemo } from "react";
import PropTypes from "prop-types";

const invariant = (condition, message) => {
  if (!condition) {
    console.error(`ResponsiveContainer: ${message}`);
  }
};

const CONTAINER_SIZES = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
};

const SPACING_VALUES = {
  sm: "space-y-4",
  md: "space-y-6",
  lg: "space-y-8",
};

const PADDING_CLASSES = `
  px-4
  sm:px-6
  lg:px-8
`;

/**
 * Un composant conteneur responsive qui gère automatiquement la largeur maximale,
 * l'espacement vertical entre les éléments enfants et le padding horizontal.
 *
 * @component
 * @param {Object} props - Les props du composant
 * @param {React.ReactNode} props.children - Les éléments enfants à afficher
 * @param {string} [props.size="lg"] - La taille maximale du conteneur ("sm", "md", "lg", "xl", "2xl")
 * @param {string} [props.spacing="md"] - L'espacement vertical entre les enfants ("sm", "md", "lg")
 * @param {boolean} [props.padding=true] - Activer/désactiver le padding horizontal
 * @param {string} [props.className=""] - Classes CSS additionnelles
 * @param {React.Ref} ref - Référence React à transmettre à l'élément div
 * @returns {React.ReactElement} Le conteneur responsive
 */
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
    // Validation des props
    invariant(
      CONTAINER_SIZES[size],
      `Invalid size prop "${size}". Must be one of: ${Object.keys(
        CONTAINER_SIZES
      ).join(", ")}`
    );
    invariant(
      SPACING_VALUES[spacing],
      `Invalid spacing prop "${spacing}". Must be one of: ${Object.keys(
        SPACING_VALUES
      ).join(", ")}`
    );

    const combinedClasses = useMemo(() => {
      const sizeClass = CONTAINER_SIZES[size] || CONTAINER_SIZES.lg;
      const spacingClass = SPACING_VALUES[spacing] || SPACING_VALUES.md;
      const paddingClass = padding ? PADDING_CLASSES : "";

      return `
        ${sizeClass}
        mx-auto
        ${spacingClass}
        ${paddingClass}
        ${className}
      `
        .replace(/\s+/g, " ")
        .trim();
    }, [size, spacing, padding, className]);

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
