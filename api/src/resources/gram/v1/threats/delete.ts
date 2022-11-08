/**
 * DELETE /api/v1/threat
 * @exports {function} handler
 */

import { Request, Response } from "express";
import { Permission } from "../../../../auth/authorization";
import { DataAccessLayer } from "../../../../data/dal";

export function _delete(dal: DataAccessLayer) {
  return async (req: Request, res: Response) => {
    const { threatId, modelId } = req.params;
    await req.authz.hasPermissionsForModelId(modelId, Permission.Write);
    await dal.threatService.delete(modelId, threatId);
    return res.json({ status: "ok" });
  };
}