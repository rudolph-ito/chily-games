require 'simplecov'
SimpleCov.start 'rails'

ROOT_DIRECTORY = File.expand_path("../..", __FILE__)

RSpec.configure do |config|
  config.mock_with :rspec
  config.treat_symbols_as_metadata_keys_with_true_values = true
  config.run_all_when_everything_filtered = true
  config.filter_run :focus
end

require 'active_support'
require 'active_support/dependencies'
require 'active_support/core_ext'
