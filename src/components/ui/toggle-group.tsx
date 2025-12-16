'use client';

import * as React from 'react';
import { Toggle as TogglePrimitive } from '@base-ui-components/react/toggle';
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui-components/react/toggle-group';
import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react';
import { type VariantProps } from 'class-variance-authority';

import { Highlight, HighlightItem, type HighlightItemProps, type HighlightProps } from '@/components/animate-ui/primitives/effects/highlight';
import { getStrictContext } from '@/lib/get-strict-context';
import { useControlledState } from '@/hooks/use-controlled-state';
import { cn } from '@/lib/utils';
import { toggleVariants } from '@/components/ui/toggle';

type ToggleGroupContextType = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: (value: any[], ...args: any[]) => void;
  multiple: boolean | undefined;
  variant?: VariantProps<typeof toggleVariants>['variant'];
  size?: VariantProps<typeof toggleVariants>['size'];
};

const [ToggleGroupProvider, useToggleGroup] = getStrictContext<ToggleGroupContextType>('ToggleGroupContext');

type ToggleGroupProps = React.ComponentProps<typeof ToggleGroupPrimitive> & VariantProps<typeof toggleVariants>;

function ToggleGroup({ className, variant, size, children, ...props }: ToggleGroupProps) {
  const [value, setValue] = useControlledState({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: props.value as any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValue: props.defaultValue as any[],
    onChange: props.onValueChange,
  });

  return (
    <ToggleGroupProvider value={{ value, setValue, multiple: props.multiple, variant, size }}>
      <ToggleGroupPrimitive
        data-slot='toggle-group'
        data-variant={variant}
        data-size={size}
        className={cn(
          'group/toggle-group flex gap-0.5 w-fit items-center rounded-lg data-[variant=outline]:shadow-xs data-[variant=outline]:border data-[variant=outline]:p-0.5',
          className,
        )}
        {...props}
        onValueChange={setValue}
      >
        {!props.multiple ? <ToggleGroupHighlight className='bg-accent rounded-md'>{children}</ToggleGroupHighlight> : children}
      </ToggleGroupPrimitive>
    </ToggleGroupProvider>
  );
}

type ToggleProps = Omit<React.ComponentProps<typeof TogglePrimitive>, 'render'> & HTMLMotionProps<'button'> & VariantProps<typeof toggleVariants>;

function Toggle({ className, children, variant, size, ...props }: ToggleProps) {
  const { variant: contextVariant, size: contextSize, multiple } = useToggleGroup();

  return (
    <ToggleHighlight value={props.value?.toString()} className={cn(multiple && 'bg-accent rounded-md')}>
      <TogglePrimitive
        {...props}
        render={
          <motion.button
            data-slot='toggle'
            data-variant={contextVariant || variant}
            data-size={contextSize || size}
            whileTap={{ scale: 0.95 }}
            className={cn(
              toggleVariants({
                variant: contextVariant || variant,
                size: contextSize || size,
              }),
              'min-w-0 border-0 flex-1 shrink-0 shadow-none rounded-md focus:z-10 focus-visible:z-10 hover:bg-accent/30',
              className,
            )}
          >
            {children}
          </motion.button>
        }
      />
    </ToggleHighlight>
  );
}

type ToggleGroupHighlightProps = Omit<HighlightProps, 'controlledItems'>;

function ToggleGroupHighlight({ transition = { type: 'spring', stiffness: 200, damping: 25 }, ...props }: ToggleGroupHighlightProps) {
  const { value } = useToggleGroup();
  const singleValue = Array.isArray(value) ? value[0] : value;

  return <Highlight data-slot='toggle-group-highlight' controlledItems value={singleValue ?? null} exitDelay={0} {...props} />;
}

type ToggleHighlightProps = HighlightItemProps &
  HTMLMotionProps<'div'> & {
    children: React.ReactElement;
  };

function ToggleHighlight({ children, style, ...props }: ToggleHighlightProps) {
  const { multiple, value } = useToggleGroup();

  if (!multiple) {
    return (
      <HighlightItem data-slot='toggle-highlight' style={{ inset: 0, ...style }} {...props}>
        {children}
      </HighlightItem>
    );
  }

  if (multiple && React.isValidElement(children)) {
    const isActive = props.value && value && (Array.isArray(value) ? value.includes(props.value) : value === props.value);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = children as React.ReactElement<any>;

    return React.cloneElement(
      children,
      {
        style: {
          ...element.props.style,
          position: 'relative',
        },
        ...element.props,
      },
      <>
        <AnimatePresence>
          {isActive && (
            <motion.div
              data-slot='toggle-highlight'
              style={{ position: 'absolute', inset: 0, zIndex: 0, ...style }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              {...props}
            />
          )}
        </AnimatePresence>

        <div
          style={{
            position: 'relative',
            zIndex: 1,
          }}
        >
          {element.props.children}
        </div>
      </>,
    );
  }
  return children;
}

export { ToggleGroup, Toggle, ToggleGroupHighlight, ToggleHighlight, useToggleGroup };
