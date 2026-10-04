import { Request, Response } from "express";
import httpStatus from "http-status";
import { isValidObjectId } from "mongoose";
import catchAsync from "../../../shared/catchAsync";
import { PointsPackageService } from "./points_package.service";

type PackageInput = {
  name?: string;
  price?: number;
  points?: number;
  features?: string[];
  is_active?: boolean;
  sort_order?: number;
};

// TODO: returns cleaned fields or an error message; `partial` allows missing fields on update.
const parseInput = (
  body: any,
  partial: boolean,
): { data?: PackageInput; error?: string } => {
  const data: PackageInput = {};

  if (body.name !== undefined || !partial) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return { error: "Package name is required" };
    }
    data.name = body.name.trim();
  }
  if (body.price !== undefined || !partial) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 1) {
      return { error: "Price must be at least 1" };
    }
    data.price = price;
  }
  if (body.points !== undefined || !partial) {
    const points = Number(body.points);
    if (!Number.isFinite(points) || points < 0) {
      return { error: "Points must be 0 or more" };
    }
    data.points = points;
  }
  if (body.features !== undefined) {
    if (!Array.isArray(body.features)) {
      return { error: "Features must be a list" };
    }
    data.features = body.features
      .filter((item: unknown) => typeof item === "string")
      .map((item: string) => item.trim())
      .filter(Boolean);
  }
  if (body.is_active !== undefined) data.is_active = Boolean(body.is_active);
  if (body.sort_order !== undefined) {
    const sortOrder = Number(body.sort_order);
    if (!Number.isFinite(sortOrder)) return { error: "Sort order must be a number" };
    data.sort_order = sortOrder;
  }

  return { data };
};

const duplicatePriceResponse = (res: Response) =>
  res.status(httpStatus.CONFLICT).json({
    success: false,
    message: "Another package already uses this price",
  });

export const PointsPackageController = {
  listActive: catchAsync(async (_req: Request, res: Response) => {
    const packages = await PointsPackageService.listActive();
    res.status(httpStatus.OK).json({
      success: true,
      message: "Points packages retrieved successfully",
      data: packages,
    });
  }),

  listAll: catchAsync(async (_req: Request, res: Response) => {
    const packages = await PointsPackageService.listAll();
    res.status(httpStatus.OK).json({
      success: true,
      message: "Points packages retrieved successfully",
      data: packages,
    });
  }),

  create: catchAsync(async (req: Request, res: Response) => {
    const { data, error } = parseInput(req.body || {}, false);
    if (error) {
      res.status(httpStatus.BAD_REQUEST).json({ success: false, message: error });
      return;
    }
    try {
      const created = await PointsPackageService.create(data!);
      res.status(httpStatus.CREATED).json({
        success: true,
        message: "Points package created successfully",
        data: created,
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        duplicatePriceResponse(res);
        return;
      }
      throw err;
    }
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    if (!isValidObjectId(req.params.id)) {
      res.status(httpStatus.NOT_FOUND).json({ success: false, message: "Package not found" });
      return;
    }
    const { data, error } = parseInput(req.body || {}, true);
    if (error) {
      res.status(httpStatus.BAD_REQUEST).json({ success: false, message: error });
      return;
    }
    try {
      const updated = await PointsPackageService.update(req.params.id, data!);
      if (!updated) {
        res.status(httpStatus.NOT_FOUND).json({ success: false, message: "Package not found" });
        return;
      }
      res.status(httpStatus.OK).json({
        success: true,
        message: "Points package updated successfully",
        data: updated,
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        duplicatePriceResponse(res);
        return;
      }
      throw err;
    }
  }),

  remove: catchAsync(async (req: Request, res: Response) => {
    const deleted = isValidObjectId(req.params.id)
      ? await PointsPackageService.remove(req.params.id)
      : null;
    if (!deleted) {
      res.status(httpStatus.NOT_FOUND).json({ success: false, message: "Package not found" });
      return;
    }
    res.status(httpStatus.OK).json({
      success: true,
      message: "Points package deleted successfully",
    });
  }),
};
