import { RuleTester } from '@typescript-eslint/rule-tester';
import * as parser from '@typescript-eslint/parser';
import { requireLocationWatchCleanupRule } from '../src/rules/require-location-watch-cleanup';

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('require-location-watch-cleanup', requireLocationWatchCleanupRule, {
  valid: [
    {
      code: `
        useEffect(() => {
          let subscription;
          Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced }, onLocation)
            .then((sub) => {
              subscription = sub;
            });
          return () => {
            subscription?.remove();
          };
        }, []);
      `,
    },
    {
      code: `
        useFocusEffect(
          useCallback(() => {
            let headingSub;
            Location.watchHeadingAsync(handleHeading).then((subscription) => {
              headingSub = subscription;
            });
            return () => headingSub?.remove();
          }, [])
        );
      `,
    },
  ],
  invalid: [
    {
      code: `Location.watchPositionAsync({}, onLocation);`,
      errors: [{ messageId: 'mustBeInEffect' }],
    },
    {
      code: `
        useEffect(() => {
          const subscription = Location.watchPositionAsync({}, onLocation);
          return () => subscription.remove();
        }, []);
      `,
      errors: [{ messageId: 'mustAwaitOrThen' }],
    },
    {
      code: `
        useEffect(() => {
          Location.watchPositionAsync({}, onLocation);
          return () => {};
        }, []);
      `,
      errors: [{ messageId: 'mustCaptureSubscription' }],
    },
    {
      code: `
        useEffect(() => {
          let subscription;
          Location.watchPositionAsync({}, onLocation).then((sub) => {
            subscription = sub;
          });
        }, []);
      `,
      errors: [{ messageId: 'noCleanupFunction' }],
    },
    {
      code: `
        useEffect(() => {
          let subscription;
          Location.watchPositionAsync({}, onLocation).then((sub) => {
            subscription = sub;
          });
          return () => console.log('missing cleanup');
        }, []);
      `,
      errors: [{ messageId: 'notCleanedUp' }],
    },
  ],
});
