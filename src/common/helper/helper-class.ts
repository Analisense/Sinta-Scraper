export default class HelperClass {
  static sleepNow = (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay));
}
