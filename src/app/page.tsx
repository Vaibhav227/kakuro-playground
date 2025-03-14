"use client";

import { useState, useRef, useEffect } from "react";
import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Define cell types for Kakuro puzzle
type CellType = "empty" | "clue" | "input";

// Define cell structure
type Cell = {
  type: CellType;
  value: number;
  rightClue?: number; // Clue for horizontal sum
  downClue?: number; // Clue for vertical sum
};

// Define Grid type
type Grid = Cell[][];

// Define Position for grid cells
type CellPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Track cell positions for the interactive grid overlay
  const [, setCellPositions] = useState<CellPosition[][]>([]);

  // Track canvas dimensions
  const [, setCanvasDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Grid positioning and sizing
  const [gridSize, setGridSize] = useState({ rows: 4, cols: 4 });
  const [cellSize, setCellSize] = useState(30);
  const [gridPosition, setGridPosition] = useState({ x: 0, y: 0 });
  const [isGridDragging, setIsGridDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(true);
  const [autoPositioned, setAutoPositioned] = useState(false);

  // Initial grid with empty cells
  const initialGrid: Grid = [
    [
      { type: "empty", value: 0 },
      { type: "clue", value: 0, downClue: 16 },
      { type: "clue", value: 0, downClue: 24 },
      { type: "clue", value: 0, downClue: 17 },
    ],
    [
      { type: "clue", value: 0, rightClue: 16 },
      { type: "input", value: 0 },
      { type: "input", value: 0 },
      { type: "input", value: 0 },
    ],
    [
      { type: "clue", value: 0, rightClue: 29 },
      { type: "input", value: 0 },
      { type: "input", value: 0 },
      { type: "input", value: 0 },
    ],
    [
      { type: "clue", value: 0, rightClue: 35 },
      { type: "input", value: 0 },
      { type: "input", value: 0 },
      { type: "input", value: 0 },
    ],
  ];

  const [grid, setGrid] = useState<Grid>(initialGrid);

  // Effect to auto-position grid when image loads
  useEffect(() => {
    if (imageUrl && !autoPositioned) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setupCanvasForImage(img);
        setAutoPositioned(true);
      };
      img.src = imageUrl;
    }
  }, [imageUrl, autoPositioned]);

  // Handle file upload
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create a URL for the uploaded image
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setIsProcessing(true);
    setAutoPositioned(false);

    // Reset grid position when uploading new image
    setGridPosition({ x: 0, y: 0 });

    setTimeout(() => {
      setIsProcessing(false);
    }, 500);
  };

  // Setup canvas based on the loaded image
  const setupCanvasForImage = (img: HTMLImageElement) => {
    if (!containerRef.current) return;

    // Set canvas dimensions based on image
    const container = containerRef.current;
    const maxWidth = container.clientWidth;
    const maxHeight = 400; // Max height for the playground

    // Calculate scale to fit image
    const imgWidth = img.width;
    const imgHeight = img.height;

    // Scale based on width and height constraints
    const scaleWidth = maxWidth / imgWidth;
    const scaleHeight = maxHeight / imgHeight;
    const scale = Math.min(scaleWidth, scaleHeight);

    // Get display dimensions
    const displayWidth = imgWidth * scale;
    const displayHeight = imgHeight * scale;

    setCanvasDimensions({ width: displayWidth, height: displayHeight });

    // Calculate cell size based on image size and grid
    const { rows, cols } = gridSize;
    const cellWidth = displayWidth / cols;
    const cellHeight = displayHeight / rows;
    const newCellSize = Math.min(cellWidth, cellHeight);
    setCellSize(Math.min(Math.max(newCellSize, 20), 60)); // Between 20 and 60px

    // Calculate grid position to center it over the image
    const gridWidth = cellSize * cols;
    const gridHeight = cellSize * rows;

    // Calculate x and y to center grid
    const marginTop = (container.clientHeight - gridHeight) / 2;
    const marginLeft = (displayWidth - gridWidth) / 2;

    setGridPosition({
      x: marginLeft,
      y: Math.max(marginTop, 10), // Ensure some minimal top margin
    });

    // Calculate cell positions
    calculateCellPositions(displayWidth, displayHeight);
  };

  // Calculate positions for grid cells based on canvas dimensions
  const calculateCellPositions = (width: number, height: number) => {
    const { rows, cols } = gridSize;
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    const positions: CellPosition[][] = [];

    for (let row = 0; row < rows; row++) {
      const rowPositions: CellPosition[] = [];
      for (let col = 0; col < cols; col++) {
        rowPositions.push({
          x: col * cellWidth,
          y: row * cellHeight,
          width: cellWidth,
          height: cellHeight,
        });
      }
      positions.push(rowPositions);
    }

    setCellPositions(positions);
  };

  // Recalculate grid position when grid size changes
  useEffect(() => {
    if (imageRef.current && containerRef.current) {
      setupCanvasForImage(imageRef.current);
    }
  }, [gridSize]);

  // Handle cell value change
  const handleCellValueChange = (
    rowIndex: number,
    colIndex: number,
    value: string
  ) => {
    // Only accept numbers 1-9 or empty string
    if (
      value !== "" &&
      (isNaN(Number(value)) || Number(value) < 1 || Number(value) > 9)
    ) {
      return;
    }

    const newGrid = [...grid];
    newGrid[rowIndex][colIndex] = {
      ...newGrid[rowIndex][colIndex],
      value: value === "" ? 0 : Number(value),
    };

    setGrid(newGrid);
  };

  // Handle grid size change
  const handleGridSizeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const [rows, cols] = e.target.value.split("x").map(Number);
    setGridSize({ rows, cols });

    // Create a new grid with the selected dimensions
    const newGrid: Grid = [];
    for (let r = 0; r < rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < cols; c++) {
        if (r === 0 && c === 0) {
          // Top-left is always empty
          row.push({ type: "empty", value: 0 });
        } else if (r === 0) {
          // First row (except first cell) contains down clues
          row.push({ type: "clue", value: 0, downClue: 0 });
        } else if (c === 0) {
          // First column (except first cell) contains right clues
          row.push({ type: "clue", value: 0, rightClue: 0 });
        } else {
          // Other cells are input cells
          row.push({ type: "input", value: 0 });
        }
      }
      newGrid.push(row);
    }

    setGrid(newGrid);
    setAutoPositioned(false); // Reset to recalculate positioning
  };

  // Cell type toggle - allows users to mark cells as empty/clue/input
  const toggleCellType = (rowIndex: number, colIndex: number) => {
    if (rowIndex === 0 && colIndex === 0) return; // Don't change the top-left cell

    const newGrid = [...grid];
    const cell = newGrid[rowIndex][colIndex];

    let newType: CellType;
    // Cycle through cell types
    if (cell.type === "empty") newType = "clue";
    else if (cell.type === "clue") newType = "input";
    else newType = "empty";

    newGrid[rowIndex][colIndex] = {
      ...cell,
      type: newType,
      value: 0,
      rightClue: newType === "clue" ? cell.rightClue || 0 : undefined,
      downClue: newType === "clue" ? cell.downClue || 0 : undefined,
    };

    setGrid(newGrid);
  };

  // Update clue values
  const updateClue = (
    rowIndex: number,
    colIndex: number,
    isRightClue: boolean,
    value: string
  ) => {
    const numValue = value === "" ? 0 : Number(value);
    if (isNaN(numValue)) return;

    const newGrid = [...grid];
    if (isRightClue) {
      newGrid[rowIndex][colIndex] = {
        ...newGrid[rowIndex][colIndex],
        rightClue: numValue,
      };
    } else {
      newGrid[rowIndex][colIndex] = {
        ...newGrid[rowIndex][colIndex],
        downClue: numValue,
      };
    }

    setGrid(newGrid);
  };

  // Handle grid dragging
  const handleGridMouseDown = (e: React.MouseEvent) => {
    if (!showControls) return;

    setIsGridDragging(true);
    setDragStart({
      x: e.clientX - gridPosition.x,
      y: e.clientY - gridPosition.y,
    });
  };

  const handleGridMouseMove = (e: React.MouseEvent) => {
    if (!isGridDragging || !showControls) return;

    setGridPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleGridMouseUp = () => {
    setIsGridDragging(false);
  };

  // Adjust cell size
  const increaseCellSize = () => {
    setCellSize((prev) => prev + 0.5);
  };

  const decreaseCellSize = () => {
    if (cellSize > 20) {
      setCellSize((prev) => prev - 0.5);
    }
  };

  // Recenter grid on image
  const recenterGrid = () => {
    if (imageRef.current) {
      setupCanvasForImage(imageRef.current);
    }
  };

  // Render the grid
  const renderGrid = () => {
    return (
      <div
        className="absolute"
        style={{
          left: `${gridPosition.x}px`,
          top: `${gridPosition.y}px`,
          cursor:
            showControls && isGridDragging
              ? "grabbing"
              : showControls
              ? "grab"
              : "default",
          border: showControls ? "1px dashed rgba(0, 0, 0, 0.5)" : "none",
        }}
        onMouseDown={handleGridMouseDown}
        onMouseMove={handleGridMouseMove}
        onMouseUp={handleGridMouseUp}
        onMouseLeave={handleGridMouseUp}
      >
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="relative"
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  border: "1px solid rgba(0, 0, 0, 0.2)",
                }}
                onDoubleClick={() =>
                  showControls && toggleCellType(rowIndex, colIndex)
                }
              >
                {renderGridCell(cell, rowIndex, colIndex)}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Render cells in the grid
  const renderGridCell = (cell: Cell, rowIndex: number, colIndex: number) => {
    switch (cell.type) {
      case "empty":
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.3)",
            }}
          />
        );

      case "clue":
        return (
          <div
            className="w-full h-full relative"
            style={{
              backgroundColor: "rgba(100, 100, 100, 0.3)",
            }}
          >
            {showControls && (
              <>
                {/* Right clue input (top-right) */}
                <input
                  type="text"
                  className="absolute right-0 top-0 w-1/2 h-1/2 text-right text-xs p-0 pr-1 bg-transparent"
                  value={cell.rightClue || ""}
                  onChange={(e) =>
                    updateClue(rowIndex, colIndex, true, e.target.value)
                  }
                  style={{
                    color: "white",
                    textShadow: "0px 0px 2px black, 0px 0px 4px black",
                    fontWeight: "bold",
                  }}
                  maxLength={2}
                />
                {/* Down clue input (bottom-left) */}
                <input
                  type="text"
                  className="absolute left-0 bottom-0 w-1/2 h-1/2 text-left text-xs p-0 pl-1 bg-transparent"
                  value={cell.downClue || ""}
                  onChange={(e) =>
                    updateClue(rowIndex, colIndex, false, e.target.value)
                  }
                  style={{
                    color: "white",
                    textShadow: "0px 0px 2px black, 0px 0px 4px black",
                    fontWeight: "bold",
                  }}
                  maxLength={2}
                />
              </>
            )}

            {!showControls && (
              <>
                {cell.rightClue !== undefined && cell.rightClue > 0 && (
                  <div
                    className="absolute top-0 right-1 text-xs font-bold"
                    style={{
                      color: "white",
                      textShadow: "0px 0px 2px black, 0px 0px 4px black",
                    }}
                  >
                    {cell.rightClue}
                  </div>
                )}
                {cell.downClue !== undefined && cell.downClue > 0 && (
                  <div
                    className="absolute bottom-0 left-1 text-xs font-bold"
                    style={{
                      color: "white",
                      textShadow: "0px 0px 2px black, 0px 0px 4px black",
                    }}
                  >
                    {cell.downClue}
                  </div>
                )}
              </>
            )}
            {/* Diagonal line */}
            <div
              className="absolute w-full h-full"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom right, transparent calc(50% - 1px), rgba(255,255,255,0.5), transparent calc(50% + 1px))",
              }}
            />
          </div>
        );

      case "input":
        return (
          <input
            type="text"
            className="w-full h-full text-center font-bold"
            style={{
              backgroundColor: showControls
                ? "rgba(255, 255, 255, 0.2)"
                : "rgba(255, 255, 255, 0.4)",
              fontSize: `${Math.max(cellSize * 0.5, 16)}px`,
              color: "#0060ff",
              textShadow: "0px 0px 1px white, 0px 0px 3px white",
              border: "1px solid rgba(0, 0, 0, 0.2)",
            }}
            value={cell.value === 0 ? "" : cell.value.toString()}
            onChange={(e) =>
              handleCellValueChange(rowIndex, colIndex, e.target.value)
            }
            disabled={showControls}
            maxLength={1}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Kakuro Puzzle</h1>

      <div className="mb-4">
        <h2 className="text-xl mb-2">Upload Kakuro Puzzle Image</h2>
        <div className="flex gap-2 mb-4">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="max-w-md"
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            Upload Image
          </Button>
        </div>

        <div className="mb-2">
          <label htmlFor="grid-size" className="block text-sm font-medium mb-1">
            Grid Size:
          </label>
          <select
            id="grid-size"
            className="px-3 py-2 border border-gray-300 rounded-md"
            onChange={handleGridSizeChange}
            defaultValue="4x4"
          >
            <option value="4x4">4x4</option>
            <option value="5x5">5x5</option>
            <option value="6x6">6x6</option>
            <option value="7x7">7x7</option>
            <option value="9x9">9x9</option>
            <option value="10x10">10x10</option>
            <option value="12x12">12x12</option>
          </select>
        </div>

        {isProcessing && (
          <div className="mt-2">
            <p>Processing image... Please wait.</p>
          </div>
        )}
      </div>

      {imageUrl && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl">Interactive Kakuro Puzzle</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowControls(!showControls)}
                variant={showControls ? "default" : "outline"}
                size="sm"
              >
                {showControls ? "Play Mode" : "Edit Mode"}
              </Button>

              {showControls && (
                <>
                  <Button onClick={recenterGrid} size="sm" variant="outline">
                    Recenter
                  </Button>
                  <Button onClick={decreaseCellSize} size="sm">
                    -
                  </Button>
                  <span className="px-2 flex items-center">{cellSize}px</span>
                  <Button onClick={increaseCellSize} size="sm">
                    +
                  </Button>
                </>
              )}
            </div>
          </div>

          <div
            className="relative border bg-gray-100 p-2 overflow-hidden"
            style={{ height: "350px" }}
          >
            <div ref={containerRef} className="relative h-full">
              <img
                src={imageUrl}
                alt="Uploaded Kakuro puzzle"
                className="max-w-full max-h-full object-contain mx-auto"
              />
              {renderGrid()}
            </div>
          </div>

          <div className="mt-4 bg-yellow-50 p-4 rounded-md">
            <p className="font-bold mb-2">Instructions:</p>

            {showControls ? (
              <ul className="list-disc pl-6">
                <li>The grid is automatically positioned over your image</li>
                <li>
                  Use &quot;Recenter&quot; to reset grid position if needed
                </li>
                <li>You can still drag the grid to fine-tune positioning</li>
                <li>Use + and - buttons to adjust cell size by 0.5px</li>
                <li>
                  Double-click a cell to change its type (empty → clue → input)
                </li>
                <li>
                  For clue cells, click in top-right to enter row sum,
                  bottom-left for column sum
                </li>
                <li>
                  When grid is set up, click &quot;Play Mode&quot; to solve the
                  puzzle
                </li>
              </ul>
            ) : (
              <ul className="list-disc pl-6">
                <li>Fill in the grid with numbers 1-9</li>
                <li>Numbers in each row must sum to the clue on the left</li>
                <li>Numbers in each column must sum to the clue above</li>
                <li>No number can be used more than once in each sum</li>
                <li>Click &quot;Edit Mode&quot; to return to grid setup</li>
              </ul>
            )}
          </div>
        </div>
      )}

      {!imageUrl && (
        <div className="mt-4 p-4 border rounded-md bg-gray-50">
          <p className="text-center text-gray-500">
            Upload a Kakuro puzzle image to start playing
          </p>
        </div>
      )}
    </div>
  );
}
