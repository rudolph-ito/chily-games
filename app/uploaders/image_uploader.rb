# encoding: utf-8

class ImageUploader < CarrierWave::Uploader::Base

  def store_dir
    "#{model.class.to_s.pluralize.underscore}/#{model.id}"
  end

  def extension_white_list
    %w(svg png)
  end

end
