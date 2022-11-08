import { Pool } from "pg";
import { TemplateHandler } from "../notifications/TemplateHandler";
import { SuggestionEngine } from "../suggestions/engine";
import { ComponentClassHandler } from "./component-classes";
import { SystemPropertyHandler } from "./system-property";
import { ControlDataService } from "./controls/ControlDataService";
import { MitigationDataService } from "./mitigations/MitigationDataService";
import { ModelDataService } from "./models/ModelDataService";
import { NotificationDataService } from "./notifications/NotificationDataService";
import { ReviewDataService } from "./reviews/ReviewDataService";
import { SuggestionDataService } from "./suggestions/SuggestionDataService";
import { ThreatDataService } from "./threats/ThreatDataService";
import { ReportDataService } from "./reports/ReportDataService";
import { GramConnectionPool } from "./postgres";

/**
 * Class that carries access to all DataServices, useful for passing dependencies.
 */
export class DataAccessLayer {
  pool: Pool;
  modelService: ModelDataService;
  controlService: ControlDataService;
  threatService: ThreatDataService;
  mitigationService: MitigationDataService;
  notificationService: NotificationDataService;
  reviewService: ReviewDataService;
  suggestionService: SuggestionDataService;
  sysPropHandler: SystemPropertyHandler;
  ccHandler: ComponentClassHandler;
  templateHandler: TemplateHandler;
  suggestionEngine: SuggestionEngine;
  reportService: ReportDataService;

  constructor(pool: Pool) {
    this.pool = pool;
    this.sysPropHandler = new SystemPropertyHandler();
    this.ccHandler = new ComponentClassHandler();
    this.templateHandler = new TemplateHandler();

    // Initialize Data Services
    this.modelService = new ModelDataService(pool, this);
    this.controlService = new ControlDataService(pool, this);
    this.threatService = new ThreatDataService(pool, this);
    this.mitigationService = new MitigationDataService(pool);
    this.notificationService = new NotificationDataService(pool, this);
    this.reviewService = new ReviewDataService(pool, this);
    this.suggestionService = new SuggestionDataService(pool, this);
    this.suggestionEngine = new SuggestionEngine(this);
    this.reportService = new ReportDataService(pool, this);
  }
}