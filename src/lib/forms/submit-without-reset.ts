import { startTransition, type FormEvent } from "react";

/**
 * React resets uncontrolled form fields after a form `action` completes, which would wipe the
 * user's input when validation fails. Submitting through onSubmit keeps the fields intact while
 * still using the action returned by useActionState (pending state, returned result).
 */
export function submitWithoutReset(action: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  };
}
