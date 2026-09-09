# Preserve RSC requests during benchmark setup

The previous /recaptcha/ URL match could also match query data in RSC payload URLs. Restrict the existing benchmark blocking to the three actual reCAPTCHA provider hosts/paths. This preserves the intended external-provider exclusion without dropping application payload requests. No runtime chunk loader, bundler, or streaming implementation is patched. The baseline already has the streaming and async-prop implementation.

Validation: changed-file ESLint, TypeScript, and the checkout behavior run use the corrected shared navigation hook. No unrelated viewport, measurement-count, throttling, or fixture change is included.
