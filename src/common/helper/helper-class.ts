export default class HelperClass {
  static sleepNow = (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay));

  // Function to split an integer into an array of equal parts
  static partition(num, partNum) {
    // Create empty array to store each part
    const partitionArray = [];

    // Calculate the segment size
    const segmentSize = Math.floor(num / partNum);

    // Start off with a non-zero value in the first element
    partitionArray[0] = num - (partNum - 1) * segmentSize;

    // Make sure that each partition has the same size
    for (let i = 1; i < partNum; i++) {
      partitionArray[i] = segmentSize;
    }

    // Return the partitioned array
    return partitionArray;
  }
}
