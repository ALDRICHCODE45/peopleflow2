export interface SalaryRangeProps {
  salaryType?: "FIXED" | "RANGE" | null;
  min?: number | null;
  max?: number | null;
  fixed?: number | null;
}

export class SalaryRangeVO {
  private readonly props: SalaryRangeProps;

  private constructor(props: SalaryRangeProps) {
    this.props = props;
  }

  static create(props: SalaryRangeProps): SalaryRangeVO {
    const { salaryType, min, max, fixed } = props;

    if (salaryType === "FIXED") {
      // FIXED mode: require fixed > 0, ignore min/max
      if (fixed === null || fixed === undefined || fixed <= 0) {
        throw new Error("El salario fijo debe ser mayor a 0");
      }
      return new SalaryRangeVO(props);
    }

    if (salaryType === "RANGE") {
      // RANGE mode: standard min/max validation
      if (min !== null && min !== undefined && min < 0) {
        throw new Error("El salario mínimo no puede ser negativo");
      }
      if (max !== null && max !== undefined && max < 0) {
        throw new Error("El salario máximo no puede ser negativo");
      }
      if (
        min !== null &&
        min !== undefined &&
        max !== null &&
        max !== undefined &&
        min > max
      ) {
        throw new Error("El salario mínimo no puede ser mayor al máximo");
      }
      return new SalaryRangeVO(props);
    }

    // Backward-compatible: no salaryType specified (null/undefined)
    if (min !== null && min !== undefined && min < 0) {
      throw new Error("El salario mínimo no puede ser negativo");
    }
    if (max !== null && max !== undefined && max < 0) {
      throw new Error("El salario máximo no puede ser negativo");
    }
    if (
      min !== null &&
      min !== undefined &&
      max !== null &&
      max !== undefined &&
      min > max
    ) {
      throw new Error("El salario mínimo no puede ser mayor al máximo");
    }
    if (fixed !== null && fixed !== undefined && fixed < 0) {
      throw new Error("El salario fijo no puede ser negativo");
    }

    return new SalaryRangeVO(props);
  }

  get min(): number | null | undefined {
    return this.props.min;
  }
  get max(): number | null | undefined {
    return this.props.max;
  }
  get fixed(): number | null | undefined {
    return this.props.fixed;
  }

  isRange(): boolean {
    return (
      (this.props.min !== null && this.props.min !== undefined) ||
      (this.props.max !== null && this.props.max !== undefined)
    );
  }

  isFixed(): boolean {
    return this.props.fixed !== null && this.props.fixed !== undefined;
  }

  /** Validación de negocio: PRE_PLACEMENT requiere salario fijo, no rango */
  isValidForPrePlacement(): boolean {
    return this.isFixed();
  }

  equals(other: SalaryRangeVO): boolean {
    return (
      this.props.min === other.props.min &&
      this.props.max === other.props.max &&
      this.props.fixed === other.props.fixed
    );
  }
}
