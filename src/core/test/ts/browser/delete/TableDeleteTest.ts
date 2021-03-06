import { Assertions } from '@ephox/agar';
import { GeneralSteps } from '@ephox/agar';
import { Logger } from '@ephox/agar';
import { Pipeline } from '@ephox/agar';
import { Step } from '@ephox/agar';
import { Arr } from '@ephox/katamari';
import { TinyApis } from '@ephox/mcagar';
import { TinyLoader } from '@ephox/mcagar';
import { Remove } from '@ephox/sugar';
import { Replication } from '@ephox/sugar';
import { Element } from '@ephox/sugar';
import { Attr } from '@ephox/sugar';
import { Html } from '@ephox/sugar';
import { SelectorFilter } from '@ephox/sugar';
import TableDelete from 'tinymce/core/delete/TableDelete';
import ModernTheme from 'tinymce/themes/modern/Theme';
import { UnitTest } from '@ephox/bedrock';

UnitTest.asynctest('browser.tinymce.core.delete.TableDeleteTest', function () {
  const success = arguments[arguments.length - 2];
  const failure = arguments[arguments.length - 1];

  ModernTheme();

  const sSetRawContent = function (editor, content) {
    return Step.sync(function () {
      editor.getBody().innerHTML = content;
    });
  };

  const sAssertRawNormalizedContent = function (editor, expectedContent) {
    return Step.sync(function () {
      const element = Replication.deep(Element.fromDom(editor.getBody()));

      // Remove internal selection dom items
      Arr.each(SelectorFilter.descendants(element, '*[data-mce-bogus="all"]'), Remove.remove);
      Arr.each(SelectorFilter.descendants(element, '*'), function (elm) {
        Attr.remove(elm, 'data-mce-selected');
      });

      Assertions.assertHtml('Should be expected contents', expectedContent, Html.get(element));
    });
  };

  const sDelete = function (editor) {
    return Step.sync(function () {
      const returnVal = TableDelete.backspaceDelete(editor, true);
      Assertions.assertEq('Should return true since the operation should have done something', true, returnVal);
    });
  };

  const sBackspace = function (editor) {
    return Step.sync(function () {
      const returnVal = TableDelete.backspaceDelete(editor, false);
      Assertions.assertEq('Should return true since the operation should have done something', true, returnVal);
    });
  };

  const sDeleteNoop = function (editor) {
    return Step.sync(function () {
      const returnVal = TableDelete.backspaceDelete(editor, true);
      Assertions.assertEq('Should return false since the operation is a noop', false, returnVal);
    });
  };

  const sBackspaceNoop = function (editor) {
    return Step.sync(function () {
      const returnVal = TableDelete.backspaceDelete(editor, false);
      Assertions.assertEq('Should return false since the operation is a noop', false, returnVal);
    });
  };

  TinyLoader.setup(function (editor, onSuccess, onFailure) {
    const tinyApis = TinyApis(editor);

    Pipeline.async({}, [
      tinyApis.sFocus,

      Logger.t('Delete selected cells or cell ranges', GeneralSteps.sequence([
        Logger.t('Collapsed range should be noop', GeneralSteps.sequence([
          tinyApis.sSetContent('<table><tbody><tr><td>a</td><td>b</td></tr></tbody></table>'),
          tinyApis.sSetCursor([0, 0, 0, 0, 0], 0),
          sDeleteNoop(editor),
          tinyApis.sAssertContent('<table><tbody><tr><td>a</td><td>b</td></tr></tbody></table>'),
          tinyApis.sAssertSelection([0, 0, 0, 0, 0], 0, [0, 0, 0, 0, 0], 0)
        ])),

        Logger.t('Range in only one cell should be noop', GeneralSteps.sequence([
          tinyApis.sSetContent('<table><tbody><tr><td>a</td><td>b</td></tr></tbody></table>'),
          tinyApis.sSetSelection([0, 0, 0, 0, 0], 0, [0, 0, 0, 0, 0], 1),
          sDeleteNoop(editor),
          tinyApis.sAssertContent('<table><tbody><tr><td>a</td><td>b</td></tr></tbody></table>'),
          tinyApis.sAssertSelection([0, 0, 0, 0, 0], 0, [0, 0, 0, 0, 0], 1)
        ])),

        Logger.t('Select all content in all cells removes table', GeneralSteps.sequence([
          tinyApis.sSetContent('<table><tbody><tr><td>a</td><td>b</td></tr></tbody></table>'),
          tinyApis.sSetSelection([0, 0, 0, 0, 0], 0, [0, 0, 0, 1, 0], 1),
          sDelete(editor),
          tinyApis.sAssertContent('')
        ])),

        Logger.t('Select some cells should empty cells', GeneralSteps.sequence([
          tinyApis.sSetContent('<table><tbody><tr><td>a</td><td>b</td><td>c</td></tr></tbody></table>'),
          tinyApis.sSetSelection([0, 0, 0, 0, 0], 0, [0, 0, 0, 1, 0], 1),
          sDelete(editor),
          tinyApis.sAssertContent('<table><tbody><tr><td>&nbsp;</td><td>&nbsp;</td><td>c</td></tr></tbody></table>')
        ])),

        Logger.t('Select some cells between rows should empty cells', GeneralSteps.sequence([
          tinyApis.sSetContent('<table><tbody><tr><th>a</th><th>b</th><th>c</th></tr><tr><td>d</td><td>e</td><td>f</td></tr></tbody></table>'),
          tinyApis.sSetSelection([0, 0, 0, 1, 0], 0, [0, 0, 1, 0, 0], 1),
          sDelete(editor),
          tinyApis.sAssertContent('<table><tbody><tr><th>a</th><th>&nbsp;</th><th>&nbsp;</th></tr><tr><td>&nbsp;</td><td>e</td><td>f</td></tr></tbody></table>'),
          tinyApis.sAssertSelection([0, 0, 0, 1], 0, [0, 0, 0, 1], 0)
        ])),

        Logger.t('delete weird selection with only tds', GeneralSteps.sequence([
          tinyApis.sSetContent('<table><tbody><tr><td>a</td><td data-mce-selected="1">b</td><td>c</td></tr><tr><td>d</td><td data-mce-selected="1">e</td><td>f</td></tr></tbody></table>'),
          tinyApis.sSetSelection([0, 0, 0, 1, 0], 0, [0, 0, 0, 1, 0], 1),
          sDelete(editor),
          tinyApis.sAssertContent('<table><tbody><tr><td>a</td><td>&nbsp;</td><td>c</td></tr><tr><td>d</td><td>&nbsp;</td><td>f</td></tr></tbody></table>')
        ])),

        Logger.t('delete weird selection with th', GeneralSteps.sequence([
          tinyApis.sSetContent('<table><tbody><tr><th>a</th><th data-mce-selected="1">b</th><th>c</th></tr><tr><td>d</td><td data-mce-selected="1">e</td><td>f</td></tr></tbody></table>'),
          tinyApis.sSetSelection([0, 0, 0, 1, 0], 0, [0, 0, 0, 1, 0], 1),
          sDelete(editor),
          tinyApis.sAssertContent('<table><tbody><tr><th>a</th><th>&nbsp;</th><th>c</th></tr><tr><td>d</td><td>&nbsp;</td><td>f</td></tr></tbody></table>')
        ])),

        Logger.t('Delete and empty cells', GeneralSteps.sequence([
          Logger.t('delete weird selection with th', GeneralSteps.sequence([
            sSetRawContent(editor, '<table><tbody><tr><td><h1><br></h1></td></tr></tbody></table>'),
            tinyApis.sSetSelection([0, 0, 0, 0, 0], 0, [0, 0, 0, 0, 0], 0),
            sDelete(editor),
            sAssertRawNormalizedContent(editor, '<table><tbody><tr><td><br data-mce-bogus="1"></td></tr></tbody></table>')
          ]))
        ]))
      ])),

      Logger.t('Delete between cells as caret', GeneralSteps.sequence([
        Logger.t('Delete between cells as a caret', GeneralSteps.sequence([
          tinyApis.sSetContent('<table><tbody><tr><td>a</td><td>b</td></tr></tbody></table>'),
          tinyApis.sSetSelection([0, 0, 0, 0, 0], 1, [0, 0, 0, 0, 0], 1),
          sDelete(editor),
          tinyApis.sAssertContent('<table><tbody><tr><td>a</td><td>b</td></tr></tbody></table>')
        ])),

        Logger.t('Backspace between cells as a caret', GeneralSteps.sequence([
          tinyApis.sSetContent('<table><tbody><tr><td>a</td><td>b</td></tr></tbody></table>'),
          tinyApis.sSetSelection([0, 0, 0, 1, 0], 0, [0, 0, 0, 1, 0], 0),
          sBackspace(editor),
          tinyApis.sAssertContent('<table><tbody><tr><td>a</td><td>b</td></tr></tbody></table>')
        ])),

        Logger.t('Delete in middle of contents in cells as a caret', GeneralSteps.sequence([
          tinyApis.sSetContent('<table><tbody><tr><td>a</td><td>b</td></tr></tbody></table>'),
          tinyApis.sSetSelection([0, 0, 0, 0, 0], 0, [0, 0, 0, 0, 0], 0),
          sDeleteNoop(editor),
          tinyApis.sAssertContent('<table><tbody><tr><td>a</td><td>b</td></tr></tbody></table>')
        ])),

        Logger.t('Backspace in middle of contents in cells as a caret', GeneralSteps.sequence([
          tinyApis.sSetContent('<table><tbody><tr><td>a</td><td>b</td></tr></tbody></table>'),
          tinyApis.sSetSelection([0, 0, 0, 1, 0], 1, [0, 0, 0, 1, 0], 1),
          sBackspaceNoop(editor),
          tinyApis.sAssertContent('<table><tbody><tr><td>a</td><td>b</td></tr></tbody></table>')
        ]))
      ])),

      Logger.t('Delete inside table caption', GeneralSteps.sequence([
        Logger.t('Simulate result of the triple click (selection beyond caption)', GeneralSteps.sequence([
          tinyApis.sSetContent('<table><caption>abc</caption><tbody><tr><td>a</td></tr></tbody></table>'),
          tinyApis.sSetSelection([0, 0, 0], 0, [0, 1, 0, 0], 0),
          sDelete(editor),
          sAssertRawNormalizedContent(editor, '<table class="mce-item-table"><caption><br data-mce-bogus="1"></caption><tbody><tr><td>a</td></tr></tbody></table>')
        ])),

        Logger.t('Deletion at the left edge', GeneralSteps.sequence([
          tinyApis.sSetContent('<table><caption>abc</caption><tbody><tr><td>a</td></tr></tbody></table>'),
          tinyApis.sSetCursor([0, 0, 0], 0),
          sBackspace(editor),
          tinyApis.sAssertContent('<table><caption>abc</caption><tbody><tr><td>a</td></tr></tbody></table>')
        ])),

        Logger.t('Deletion at the right edge', GeneralSteps.sequence([
          tinyApis.sSetContent('<table><caption>abc</caption><tbody><tr><td>a</td></tr></tbody></table>'),
          tinyApis.sSetCursor([0, 0, 0], 3),
          sDelete(editor),
          tinyApis.sAssertContent('<table><caption>abc</caption><tbody><tr><td>a</td></tr></tbody></table>')
        ])),

        Logger.t('Backspace at last character positon', GeneralSteps.sequence([
          tinyApis.sSetContent('<table><caption>a</caption><tbody><tr><td>a</td></tr></tbody></table>'),
          tinyApis.sSetCursor([0, 0, 0], 1),
          sBackspace(editor),
          sAssertRawNormalizedContent(editor, '<table class="mce-item-table"><caption><br data-mce-bogus="1"></caption><tbody><tr><td>a</td></tr></tbody></table>')
        ])),

        Logger.t('Delete at last character positon', GeneralSteps.sequence([
          tinyApis.sSetContent('<table><caption>a</caption><tbody><tr><td>a</td></tr></tbody></table>'),
          tinyApis.sSetCursor([0, 0, 0], 0),
          sDelete(editor),
          sAssertRawNormalizedContent(editor, '<table class="mce-item-table"><caption><br data-mce-bogus="1"></caption><tbody><tr><td>a</td></tr></tbody></table>')
        ])),

        Logger.t('Backspace at character positon in middle of caption', GeneralSteps.sequence([
          tinyApis.sSetContent('<table><caption>ab</caption><tbody><tr><td>a</td></tr></tbody></table>'),
          tinyApis.sSetCursor([0, 0, 0], 1),
          sBackspaceNoop(editor)
        ])),

        Logger.t('Delete at character positon in middle of caption', GeneralSteps.sequence([
          tinyApis.sSetContent('<table><caption>ab</caption><tbody><tr><td>a</td></tr></tbody></table>'),
          tinyApis.sSetCursor([0, 0, 0], 1),
          sDeleteNoop(editor)
        ])),

        Logger.t('Caret in caption with blocks', GeneralSteps.sequence([
          tinyApis.sSetContent('<table><caption><p>abc</p></caption><tbody><tr><td>a</td></tr></tbody></table>'),
          tinyApis.sSetCursor([0, 0, 0, 0], 1),
          sDeleteNoop(editor)
        ])),

        Logger.t('Debris like empty nodes and brs constitute an empty caption', GeneralSteps.sequence([
          tinyApis.sSetContent('<table><caption><p><br></p><p data-mce-caret="after" data-mce-bogus="all"><br data-mce-bogus="1"></p></caption><tbody><tr><td>a</td></tr></tbody></table>'),
          tinyApis.sSetCursor([0, 0], 0),
          sDelete(editor),
          sAssertRawNormalizedContent(editor, '<table class="mce-item-table"><caption><br data-mce-bogus="1"></caption><tbody><tr><td>a</td></tr></tbody></table>')
        ]))
      ]))
    ], onSuccess, onFailure);
  }, {
    indent: false,
    skin_url: '/project/js/tinymce/skins/lightgray'
  }, success, failure);
});
