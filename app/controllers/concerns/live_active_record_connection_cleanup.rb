# frozen_string_literal: true

module LiveActiveRecordConnectionCleanup
  extend ActiveSupport::Concern

  private
    def clear_live_active_record_connections
      yield
    ensure
      release_live_active_record_connections
    end

    def release_live_active_record_connections
      ActiveRecord::Base.connection_handler.clear_active_connections!(:all)
    end
end
