import type { ComponentChildren } from 'preact';
import type { CSSProperties } from 'preact/compat';
import { memo } from 'preact/compat';

import styles from './styles.scss';
import { createClassName } from '../../../helpers/createClassName';

type ComposerActionProps = {
	text: string;
	onClick: () => void;
	disabled?: boolean;
	className?: string;
	style?: CSSProperties;
	children?: ComponentChildren;
};

export const ComposerAction = memo(({ text, onClick, disabled, className, style = {}, children }: ComposerActionProps) => (
	<button
		type='button'
		aria-label={text}
		onClick={onClick}
		disabled={disabled}
		className={createClassName(styles, 'composer__action', {}, [className])}
		style={style}
	>
		{children}
	</button>
));
