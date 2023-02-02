import { Component } from "react";
import { twMerge, twJoin } from "tailwind-merge";

type Props = {
  onChange: (...args: any[]) => void;
  id: string;
  isSelected: boolean;
  label: string;
  value: string | number;
  className?: string;
  disabled: boolean;
};

class RadioButton extends Component<Props> {
  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    const { onChange, id, isSelected, label, value, className, disabled } = this.props;

    return (
      <div 
        className={twMerge(
          twJoin("flex justify-center items-center px-[12px]"),
          className
        )}
      >
        <input
          className={twJoin(
            "appearance-none w-[18px] h-[18px] cursor-pointer bg-transparent border-[#808080] border-[1px] rounded-full",
            "checked:border-[#d1f52c] checked:border-[5px]",
            disabled && "cursor-not-allowed opacity-30",
          )}
          id={id}
          onChange={onChange}
          value={value}
          type="radio"
          checked={isSelected}
          disabled={disabled}
        />
        <label
          className={twJoin(
            "inline-block pl-[8px]",
            "text-[14px] text-[#808080] whitespace-nowrap",
            "cursor-pointer",
            disabled && "cursor-not-allowed opacity-30",
          )}
          htmlFor={id}
        >
          {label}
        </label>
      </div>
    );
  }
}

export default RadioButton;
