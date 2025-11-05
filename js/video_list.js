// 影片清單（以 SVG + PDF 組合為縮圖）
window.WAFER_VIDEOS = [
  {
    n: 1,
    qid: 1,
    title: "IC 是如何製造的",
    file: "ic_make_1.mp4",
    // 圖像由一個 SVG + 一個對應 PDF 組成
    svg: "ic_make.svg",
    pdf: "image1.pdf"
  },

  // 範例：第二、三支影片對應不同 PDF（共用同一個 SVG）
  // { n: 2, qid: 2, title: "薄膜沉積入門", file: "ic_make_2.mp4", svg: "ic_make.svg", pdf: "image2.pdf" },
  // { n: 3, qid: 3, title: "微影實作基礎", file: "ic_make_3.mp4", svg: "ic_make.svg", pdf: "image3.pdf" },
];
