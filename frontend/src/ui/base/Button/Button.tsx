// See: https://tailwindui.com/components/application-ui/elements/buttons

import { MouseEventHandler, ReactElement, ReactNode } from "react";
import { ButtonStyles, getButtonClass } from "src/ui/base/Button/styles";

interface ButtonProps extends ButtonStyles {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export default function Button({
  onClick,
  variant,
  round,
  fill,
  children,
}: ButtonProps): ReactElement {
  const buttonClassName = getButtonClass({ variant, round, fill });

  return (
    <button onClick={onClick} type="button" className={buttonClassName}>
      {children}
    </button>
  );
}