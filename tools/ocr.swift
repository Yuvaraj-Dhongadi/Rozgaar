import Foundation
import Vision
import PDFKit
import ImageIO

guard CommandLine.arguments.count == 2 else { exit(2) }
let url = URL(fileURLWithPath: CommandLine.arguments[1])

func recognize(_ image: CGImage) throws -> String {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    request.usesCPUOnly = true
    try VNImageRequestHandler(cgImage: image).perform([request])
    return (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }.joined(separator: "\n")
}

do {
    if url.pathExtension.lowercased() == "pdf", let pdf = PDFDocument(url: url) {
        var pages: [String] = []
        for index in 0..<min(pdf.pageCount, 3) {
            guard let page = pdf.page(at: index) else { continue }
            if let text = page.string, !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                pages.append(text)
            } else {
                let thumb = page.thumbnail(of: CGSize(width: 1700, height: 2200), for: .mediaBox)
                if let image = thumb.cgImage(forProposedRect: nil, context: nil, hints: nil) {
                    pages.append(try recognize(image))
                }
            }
        }
        print(pages.joined(separator: "\n\n"))
    } else if let source = CGImageSourceCreateWithURL(url as CFURL, nil),
              let image = CGImageSourceCreateThumbnailAtIndex(source, 0, [
                kCGImageSourceCreateThumbnailFromImageAlways: true,
                kCGImageSourceCreateThumbnailWithTransform: true,
                kCGImageSourceThumbnailMaxPixelSize: 2400
              ] as CFDictionary) {
        print(try recognize(image))
    } else {
        exit(2)
    }
} catch {
    FileHandle.standardError.write(Data(String(describing: error).utf8))
    exit(1)
}
