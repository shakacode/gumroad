# frozen_string_literal: true

require "json"

class ControlPlaneBenchmarkSidekiqClientMiddleware
  ACTIVE_JOB_WRAPPER = "ActiveJob::QueueAdapters::SidekiqAdapter::JobWrapper"
  ALLOWED_JOB_CLASSES = %w[
    ElasticsearchIndexerWorker
    SendToElasticsearchWorker
    ProcessAssetPreviewRetinaWorker
    ResizeOversizedAssetPreviewWorker
    GenerateVideoPosterWorker
    InvalidateProductCacheWorker
  ].freeze
  ALLOWED_ACTIVE_JOB_CLASSES = %w[
    ActiveStorage::PurgeJob
  ].freeze

  def call(worker_class, job, queue, _redis_pool)
    return yield unless ENV["CONTROL_PLANE_BENCHMARK"] == "true"

    job_class = job_class_name(worker_class, job)
    return yield if allowed_job_class?(worker_class, job_class)

    Sidekiq.logger.warn(
      {
        event: "control_plane_benchmark_sidekiq_job_dropped",
        job_class: job_class,
        queue: queue,
      }.to_json
    )
    nil
  end

  private
    def allowed_job_class?(worker_class, job_class)
      ALLOWED_JOB_CLASSES.include?(job_class) ||
        worker_class.to_s == ACTIVE_JOB_WRAPPER && ALLOWED_ACTIVE_JOB_CLASSES.include?(job_class)
    end

    def job_class_name(worker_class, job)
      worker_class_name = worker_class.to_s
      return worker_class_name unless worker_class_name == ACTIVE_JOB_WRAPPER

      wrapped = job["wrapped"]
      return wrapped if wrapped.is_a?(String) && !wrapped.empty?

      active_job = job.fetch("args", []).first
      active_job["job_class"] if active_job.is_a?(Hash)
    end
end
