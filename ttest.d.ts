declare module "ttest" {
  class TTest {
    confidence(): [number, number];
    testValue(): number;
    pValue(): number;
    freedom(): number;
  }

  export = (a: number[], b: number[], options: { alpha: number }) => TStat;
}
