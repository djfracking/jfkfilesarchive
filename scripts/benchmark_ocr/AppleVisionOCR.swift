#!/usr/bin/env swift
import Foundation
import Vision
import PDFKit
import AppKit

struct PageResult: Encodable {
    let source: String
    let page: Int
    let elapsedSeconds: Double
    let text: String
}

func renderPage(_ page: PDFPage, scale: CGFloat = 2.0) -> CGImage? {
    let bounds = page.bounds(for: .mediaBox)
    let width = Int(bounds.width * scale)
    let height = Int(bounds.height * scale)
    guard width > 0, height > 0 else { return nil }

    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let context = CGContext(
        data: nil,
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ) else {
        return nil
    }

    context.setFillColor(NSColor.white.cgColor)
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))
    context.saveGState()
    context.scaleBy(x: scale, y: scale)
    page.draw(with: .mediaBox, to: context)
    context.restoreGState()

    return context.makeImage()
}

func recognize(cgImage: CGImage) throws -> String {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    request.recognitionLanguages = ["en-US"]

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    try handler.perform([request])

    let observations = request.results ?? []
    return observations.compactMap { observation in
        observation.topCandidates(1).first?.string
    }.joined(separator: "\n")
}

func loadImage(path: String) -> CGImage? {
    guard let image = NSImage(contentsOfFile: path) else { return nil }
    var proposed = CGRect(origin: .zero, size: image.size)
    return image.cgImage(forProposedRect: &proposed, context: nil, hints: nil)
}

func usage() -> Never {
    fputs("Usage: AppleVisionOCR.swift <input.pdf|image> [max_pages]\n", stderr)
    exit(2)
}

let args = CommandLine.arguments
guard args.count >= 2 else { usage() }

let input = args[1]
let maxPages = args.count >= 3 ? Int(args[2]) : nil
let url = URL(fileURLWithPath: input)
var results: [PageResult] = []

if input.lowercased().hasSuffix(".pdf") {
    guard let document = PDFDocument(url: url) else {
        fputs("Could not open PDF: \(input)\n", stderr)
        exit(1)
    }

    let pageCount = min(document.pageCount, maxPages ?? document.pageCount)
    for index in 0..<pageCount {
        guard let page = document.page(at: index), let image = renderPage(page) else {
            continue
        }
        let start = Date()
        let text = (try? recognize(cgImage: image)) ?? ""
        results.append(PageResult(
            source: input,
            page: index + 1,
            elapsedSeconds: Date().timeIntervalSince(start),
            text: text
        ))
    }
} else {
    guard let image = loadImage(path: input) else {
        fputs("Could not open image: \(input)\n", stderr)
        exit(1)
    }
    let start = Date()
    let text = (try? recognize(cgImage: image)) ?? ""
    results.append(PageResult(
        source: input,
        page: 1,
        elapsedSeconds: Date().timeIntervalSince(start),
        text: text
    ))
}

let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
let data = try encoder.encode(results)
FileHandle.standardOutput.write(data)
FileHandle.standardOutput.write("\n".data(using: .utf8)!)

