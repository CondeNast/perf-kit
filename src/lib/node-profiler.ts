import * as inspector from "inspector";

export function enable(session: inspector.Session): Promise<void> {
  return new Promise((resolve, reject) => {
    session.connect();
    session.post("Profiler.enable", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function disable(session: inspector.Session): Promise<void> {
  return new Promise((resolve, reject) => {
    session.post("Profiler.disable", (err) => {
      if (err) reject(err);
      else {
        session.disconnect();
        resolve();
      }
    });
  });
}

export function run<T>(
  session: inspector.Session,
  cases: T[],
  runner: (testCase: T) => void
): Promise<inspector.Profiler.Profile | undefined> {
  return new Promise((resolve, reject) => {
    session.post("Profiler.start", (err) => {
      if (err) {
        reject(err);
      } else {
        for (let i = 0, len = cases.length; i < len; i++) {
          runner(cases[i]);
        }
        session.post("Profiler.stop", (err, { profile }) => {
          if (err != null) reject(err);
          else resolve(profile);
        });
      }
    });
  });
}
